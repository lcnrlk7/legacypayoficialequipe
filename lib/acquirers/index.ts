import { sql } from "@/lib/db";
import { MisticPay, mapPixKeyType } from "./misticpay";
import { MedusaPayments, MEDUSA_STATUS_MAP } from "./medusa";

export interface AcquirerConfig {
  id: string;
  name: string;
  code: string;
  api_url: string;
  api_key: string;
  api_secret?: string;
  is_active: boolean;
  priority: number;
  fee_percentage: number;
  fixed_fee?: number;
  withdrawal_fee?: number;
  route_type: 'white' | 'black';
}

// Nomes amigáveis para mostrar no painel do usuário (não mostrar nomes reais das adquirentes)
export const ROUTE_DISPLAY_NAMES = {
  white: "Gateway Premium",
  black: "Gateway Express",
} as const;

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  copyPaste?: string;
  expiresAt?: string;
  amount?: number;
  fee?: number;
  error?: string;
  data?: {
    transactionId?: string;
    qrCode?: string;
    qrCodeBase64?: string;
    copyPaste?: string;
    pixCode?: string;
    amount?: number;
    fee?: number;
  };
}

export interface WithdrawalResult {
  success: boolean;
  withdrawalId?: string;
  status?: string;
  error?: string;
}

export interface BalanceResult {
  success: boolean;
  balance?: number;
  available?: number;
  error?: string;
}

export interface TransactionStatus {
  success: boolean;
  status?: string;
  paidAt?: string;
  error?: string;
}

/**
 * Busca a adquirente ativa com maior prioridade
 */
export async function getActiveAcquirer(): Promise<AcquirerConfig | null> {
  try {
    const result = await sql`
      SELECT * FROM acquirers 
      WHERE is_active = true 
      ORDER BY priority ASC 
      LIMIT 1
    `;

    if (result.length === 0) {
      console.error("[Acquirer] Nenhuma adquirente ativa encontrada");
      return null;
    }

    return result[0] as AcquirerConfig;
  } catch (error) {
    console.error("[Acquirer] Erro ao buscar adquirente ativa:", error);
    return null;
  }
}

/**
 * Busca a adquirente baseado no tipo de rota do usuário
 * @param routeType - 'white' para MisticPay, 'black' para PromissePay
 */
export async function getAcquirerByRoute(routeType: 'white' | 'black'): Promise<AcquirerConfig | null> {
  try {
    const result = await sql`
      SELECT * FROM acquirers 
      WHERE is_active = true AND route_type = ${routeType}
      ORDER BY priority ASC 
      LIMIT 1
    `;

    if (result.length === 0) {
      console.error(`[Acquirer] Nenhuma adquirente ${routeType} encontrada`);
      // Fallback para qualquer adquirente ativa
      return getActiveAcquirer();
    }

    return result[0] as AcquirerConfig;
  } catch (error) {
    console.error(`[Acquirer] Erro ao buscar adquirente ${routeType}:`, error);
    return null;
  }
}

/**
 * Busca o tipo de rota de um usuário
 */
export async function getUserRouteType(userId: string): Promise<'white' | 'black'> {
  try {
    const result = await sql`
      SELECT route_type FROM profiles WHERE id = ${userId}
    `;

    if (result.length > 0 && result[0].route_type) {
      return result[0].route_type as 'white' | 'black';
    }

    return 'black'; // Padrão
  } catch (error) {
    console.error("[Acquirer] Erro ao buscar rota do usuário:", error);
    return 'black';
  }
}

/**
 * Busca a adquirente correta para um usuário específico
 */
export async function getAcquirerForUser(userId: string): Promise<AcquirerConfig | null> {
  const routeType = await getUserRouteType(userId);
  return getAcquirerByRoute(routeType);
}

/**
 * Busca uma adquirente específica pelo código
 */
export async function getAcquirerByCode(code: string): Promise<AcquirerConfig | null> {
  try {
    const result = await sql`
      SELECT * FROM acquirers 
      WHERE code = ${code} AND is_active = true
    `;

    if (result.length === 0) {
      console.error(`[Acquirer] Adquirente ${code} não encontrada ou inativa`);
      return null;
    }

    return result[0] as AcquirerConfig;
  } catch (error) {
    console.error(`[Acquirer] Erro ao buscar adquirente ${code}:`, error);
    return null;
  }
}

/**
 * Cria pagamento PIX usando a adquirente configurada para o usuário
 * @param userId - ID do usuário para determinar a rota (white/black)
 */
export async function createPixPayment(
  amount: number,
  externalId: string,
  userId?: string,
  description?: string,
  payerName?: string,
  payerDocument?: string
): Promise<PaymentResult> {
  const config = userId
    ? await getAcquirerForUser(userId)
    : await getActiveAcquirer();

  if (!config) {
    return { success: false, error: "Nenhuma adquirente ativa configurada" };
  }

  try {
    switch (config.code) {
      case "misticpay": {
        const client = new MisticPay({
          clientId: config.api_key,
          clientSecret: config.api_secret || "",
        });

        const result = await client.createPixCharge({
          amount: amount * 100, // Converter para centavos
          payerName: payerName || "Cliente",
          payerDocument: payerDocument || "00000000000",
          transactionId: externalId,
          description: description || "Pagamento PIX",
        });

        if (result.success && result.data) {
          return {
            success: true,
            transactionId: result.data.transactionId,
            qrCode: result.data.qrCode,
            qrCodeBase64: result.data.qrCodeBase64,
            copyPaste: result.data.copyPaste,
            amount: result.data.amount,
            fee: result.data.fee,
          };
        }
        return { success: false, error: result.error };
      }

      case "medusa": {
        const client = new MedusaPayments({
          secretKey: config.api_key,
          licenseKey: config.api_secret
        });

        // URL fixa do webhook - SEMPRE enviar para garantir que callbacks funcionem
        const webhookUrl = "https://legacypay.site/api/webhooks/medusa";
        console.log("[Medusa] Criando PIX com postbackUrl:", webhookUrl);

        const result = await client.createSimplePixPayment(
          amount * 100, // Converter para centavos
          payerName || "Cliente",
          payerDocument || "00000000000",
          undefined, // email
          description || "Pagamento PIX",
          webhookUrl
        );
        
        console.log("[Medusa] PIX criado, ID:", result.id);

        return {
          success: true,
          transactionId: String(result.id),
          qrCode: result.pix?.qrcode,
          copyPaste: result.pix?.qrcode,
          expiresAt: result.pix?.expirationDate,
          amount: result.amount / 100,
        };
      }

      default:
        return { success: false, error: `Adquirente ${config.code} não suportada` };
    }
  } catch (error) {
    console.error(`[Acquirer] Erro ao criar pagamento:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao processar pagamento"
    };
  }
}

/**
 * Solicita saque PIX usando a adquirente configurada para o usuário
 * @param userId - ID do usuário para determinar a rota (white/black)
 */
export async function createWithdrawal(
  amount: number,
  pixKey: string,
  userId?: string,
  pixKeyType?: string,
  description?: string
): Promise<WithdrawalResult> {
  const config = userId
    ? await getAcquirerForUser(userId)
    : await getActiveAcquirer();

  if (!config) {
    return { success: false, error: "Nenhuma adquirente ativa configurada" };
  }

  try {
    switch (config.code) {
      case "misticpay": {
        const client = new MisticPay({
          clientId: config.api_key,
          clientSecret: config.api_secret || "",
        });

        const result = await client.withdraw({
          amount: amount * 100, // Converter para centavos
          pixKey,
          pixKeyType: mapPixKeyType(pixKey),
          description: description || "Saque PIX",
        });

        if (result.success && result.data) {
          return {
            success: true,
            withdrawalId: String(result.data.transactionId),
            status: result.data.status,
          };
        }
        return { success: false, error: result.error };
      }

      case "medusa": {
        const client = new MedusaPayments({
          secretKey: config.api_key,
          licenseKey: config.api_secret
        });

        // Buscar dados do usuário para o saque
        let beneficiaryName = "Cliente";
        let beneficiaryDocument = "00000000000";

        if (userId) {
          const userData = await sql`
            SELECT name, cpf_cnpj FROM profiles WHERE id = ${userId}
          `;
          if (userData.length > 0) {
            beneficiaryName = userData[0].name || "Cliente";
            beneficiaryDocument = userData[0].cpf_cnpj || "00000000000";
          }
        }

        // URL do webhook para receber status do saque
        const withdrawalWebhookUrl = "https://legacypay.site/api/webhooks/medusa";

        // A Medusa cobra R$ 5 de taxa que é descontada do valor enviado
        // Para o usuário receber o valor líquido correto, enviamos: valor + taxa_medusa
        // Exemplo: usuário saca R$ 30, nossa taxa R$ 7, líquido R$ 23
        // Enviamos R$ 23 + R$ 5 = R$ 28 para Medusa
        // Medusa desconta R$ 5 e transfere R$ 23 para o usuário
        const MEDUSA_WITHDRAWAL_FEE = 5.00; // Taxa fixa da Medusa para saques
        const amountToSend = amount + MEDUSA_WITHDRAWAL_FEE;

        const result = await client.requestSimpleWithdrawal(
          amountToSend * 100, // Converter para centavos
          pixKey,
          beneficiaryName,
          beneficiaryDocument,
          withdrawalWebhookUrl
        );

        return {
          success: true,
          withdrawalId: result.id,
          status: result.status,
        };
      }

      default:
        return { success: false, error: `Adquirente ${config.code} não suportada` };
    }
  } catch (error) {
    console.error(`[Acquirer] Erro ao criar saque:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao processar saque"
    };
  }
}

/**
 * Consulta status de uma transação
 */
export async function getTransactionStatus(
  transactionId: string,
  acquirerCode?: string
): Promise<TransactionStatus> {
  const config = acquirerCode
    ? await getAcquirerByCode(acquirerCode)
    : await getActiveAcquirer();

  if (!config) {
    return { success: false, error: "Adquirente não encontrada" };
  }

  try {
    switch (config.code) {
      case "misticpay": {
        const client = new MisticPay({
          clientId: config.api_key,
          clientSecret: config.api_secret || "",
        });

        const result = await client.checkTransaction(transactionId);

        if (result.success && result.data) {
          const statusMap: Record<string, string> = {
            "PENDENTE": "pending",
            "COMPLETO": "completed",
            "FALHA": "failed",
          };
          return {
            success: true,
            status: statusMap[result.data.status] || "pending",
            paidAt: result.data.updatedAt,
          };
        }
        return { success: false, error: result.error };
      }

      case "medusa": {
        const client = new MedusaPayments({
          secretKey: config.api_key,
          licenseKey: config.api_secret // lic_6ed30e4bb4b87b4daa17bc9b6a19cdc5
        });
        const result = await client.getTransaction(transactionId);

        return {
          success: true,
          status: MEDUSA_STATUS_MAP[result.status] || result.status,
          paidAt: result.paidAt,
        };
      }

      default:
        return { success: false, error: `Adquirente ${config.code} não suportada` };
    }
  } catch (error) {
    console.error(`[Acquirer] Erro ao consultar transação:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao consultar transação"
    };
  }
}

/**
 * Consulta saldo da adquirente
 */
export async function checkAcquirerBalance(acquirerCode?: string): Promise<BalanceResult> {
  const config = acquirerCode
    ? await getAcquirerByCode(acquirerCode)
    : await getActiveAcquirer();

  if (!config) {
    return { success: false, error: "Adquirente não encontrada" };
  }

  try {
    switch (config.code) {
      case "misticpay": {
        const client = new MisticPay({
          clientId: config.api_key,
          clientSecret: config.api_secret || "",
        });

        const result = await client.getBalance();

        if (result.success && result.data) {
          return {
            success: true,
            balance: result.data.balance / 100,
          };
        }
        return { success: false, error: result.error };
      }

      case "medusa": {
        const client = new MedusaPayments({
          secretKey: config.api_key,
          licenseKey: config.api_secret // lic_6ed30e4bb4b87b4daa17bc9b6a19cdc5
        });
        const result = await client.checkBalance();

        return {
          success: true,
          balance: result.balance / 100,
          available: result.available / 100,
        };
      }

      default:
        return { success: false, error: `Adquirente ${config.code} não suportada` };
    }
  } catch (error) {
    console.error(`[Acquirer] Erro ao consultar saldo:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao consultar saldo"
    };
  }
}

/**
 * Lista todas as adquirentes ativas
 */
export async function listActiveAcquirers(): Promise<AcquirerConfig[]> {
  try {
    const result = await sql`
      SELECT * FROM acquirers 
      WHERE is_active = true 
      ORDER BY priority ASC
    `;
    return result as AcquirerConfig[];
  } catch (error) {
    console.error("[Acquirer] Erro ao listar adquirentes:", error);
    return [];
  }
}

/**
 * Busca configurações de taxa do sistema
 */
export interface FeeConfig {
  pixFixedFee: number;      // Taxa fixa PIX (R$)
  pixPercentageFee: number; // Taxa percentual PIX (%)
  withdrawalFee: number;    // Taxa de saque (R$)
}

/**
 * Busca taxas do sistema para a rota black (padrão)
 */
export async function getSystemFees(): Promise<FeeConfig> {
  return getSystemFeesByRoute('black');
}

/**
 * Busca taxas do sistema baseado na rota do usuário
 * As taxas são buscadas diretamente da tabela acquirers
 * Taxas padrão de saque: White (MisticPay) = R$ 2,00 | Black (Medusa) = R$ 5,00
 */
export async function getSystemFeesByRoute(routeType: 'white' | 'black'): Promise<FeeConfig> {
  try {
    // Buscar taxas diretamente da adquirente da rota
    const acquirer = await getAcquirerByRoute(routeType);

    // Taxas padrão de saque por rota
    const defaultWithdrawalFee = routeType === 'white' ? 2.00 : 5.00;

    if (acquirer) {
      return {
        pixFixedFee: Number(acquirer.fixed_fee) || (routeType === 'white' ? 1.50 : 1.00),
        pixPercentageFee: Number(acquirer.fee_percentage) || (routeType === 'white' ? 0 : 5.00),
        withdrawalFee: Number(acquirer.withdrawal_fee) || defaultWithdrawalFee,
      };
    }

    // Taxas padrão por rota se não encontrar adquirente
    return routeType === 'white'
      ? { pixFixedFee: 1.50, pixPercentageFee: 0, withdrawalFee: 2.00 }
      : { pixFixedFee: 1.00, pixPercentageFee: 5.00, withdrawalFee: 5.00 };
  } catch (error) {
    console.error("[Acquirer] Erro ao buscar taxas:", error);
    return routeType === 'white'
      ? { pixFixedFee: 1.50, pixPercentageFee: 0, withdrawalFee: 2.00 }
      : { pixFixedFee: 1.00, pixPercentageFee: 5.00, withdrawalFee: 5.00 };
  }
}

/**
 * Busca taxas do sistema para um usuário específico
 * Considera taxa de saque personalizada do usuário se configurada
 */
export async function getSystemFeesForUser(userId: string): Promise<FeeConfig> {
  try {
    // Buscar rota e taxa personalizada do usuário
    const userResult = await sql`
      SELECT route_type, withdrawal_fee FROM profiles WHERE id = ${userId}
    `;
    
    const routeType = (userResult[0]?.route_type || 'black') as 'white' | 'black';
    const userWithdrawalFee = userResult[0]?.withdrawal_fee;
    
    // Buscar taxas da rota
    const routeFees = await getSystemFeesByRoute(routeType);
    
    // Se o usuário tem taxa de saque personalizada, usar ela
    if (userWithdrawalFee !== null && userWithdrawalFee !== undefined) {
      return {
        ...routeFees,
        withdrawalFee: Number(userWithdrawalFee),
      };
    }
    
    return routeFees;
  } catch (error) {
    console.error("[Acquirer] Erro ao buscar taxas do usuário:", error);
    const routeType = await getUserRouteType(userId);
    return getSystemFeesByRoute(routeType);
  }
}

/**
 * Calcula as taxas para uma transação PIX
 * Retorna o valor líquido que o usuário receberá e a taxa total cobrada
 */
export function calculatePixFees(
  grossAmount: number,
  fees: FeeConfig
): { netAmount: number; totalFee: number; percentageFee: number; fixedFee: number } {
  const percentageFee = grossAmount * (fees.pixPercentageFee / 100);
  const fixedFee = fees.pixFixedFee;
  const totalFee = percentageFee + fixedFee;
  const netAmount = grossAmount - totalFee;

  return {
    netAmount: Math.max(0, netAmount),
    totalFee,
    percentageFee,
    fixedFee,
  };
}

/**
 * Calcula as taxas para um saque
 * Retorna o valor líquido que será enviado e a taxa cobrada
 */
export function calculateWithdrawalFees(
  grossAmount: number,
  fees: FeeConfig
): { netAmount: number; totalFee: number } {
  const totalFee = fees.withdrawalFee;
  const netAmount = grossAmount - totalFee;

  return {
    netAmount: Math.max(0, netAmount),
    totalFee,
  };
}

/**
 * Calcula o lucro do LegacyPay em uma transação PIX
 * (diferença entre taxa cobrada do usuário e taxa paga à adquirente)
 */
export async function calculatePixProfit(
  grossAmount: number
): Promise<{ userFee: number; acquirerFee: number; profit: number }> {
  const systemFees = await getSystemFees();
  const acquirer = await getActiveAcquirer();

  // Taxa cobrada do usuário
  const userPercentageFee = grossAmount * (systemFees.pixPercentageFee / 100);
  const userFee = userPercentageFee + systemFees.pixFixedFee;

  // Taxa paga à adquirente (buscar da configuração)
  let acquirerFee = 0;
  if (acquirer) {
    const acquirerData = await sql`
      SELECT fee_percentage, fixed_fee FROM acquirers WHERE id = ${acquirer.id}
    `;
    if (acquirerData.length > 0) {
      const acqPercentage = Number(acquirerData[0].fee_percentage) || 3;
      const acqFixed = Number(acquirerData[0].fixed_fee) || 0.35;
      acquirerFee = (grossAmount * (acqPercentage / 100)) + acqFixed;
    }
  }

  const profit = userFee - acquirerFee;

  return { userFee, acquirerFee, profit };
}

/**
 * Calcula o lucro do LegacyPay em um saque
 */
export async function calculateWithdrawalProfit(
  amount: number
): Promise<{ userFee: number; acquirerFee: number; profit: number }> {
  const systemFees = await getSystemFees();
  const acquirer = await getActiveAcquirer();

  // Taxa cobrada do usuário
  const userFee = systemFees.withdrawalFee;

  // Taxa paga à adquirente
  let acquirerFee = 2.50; // Padrão
  if (acquirer) {
    const acquirerData = await sql`
      SELECT withdrawal_fee FROM acquirers WHERE id = ${acquirer.id}
    `;
    if (acquirerData.length > 0 && acquirerData[0].withdrawal_fee) {
      acquirerFee = Number(acquirerData[0].withdrawal_fee);
    }
  }

  const profit = userFee - acquirerFee;

  return { userFee, acquirerFee, profit };
}
