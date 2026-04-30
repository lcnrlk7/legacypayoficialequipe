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

  if (!config.api_key) {
    return { success: false, error: "Credenciais da adquirente não configuradas" };
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

        // URL do webhook para callbacks
        const webhookUrl = "https://legacypay.site/api/webhooks/medusa";

        // Garantir que todos os parâmetros tenham valores válidos
        const safePayerName = (payerName && payerName.trim()) ? payerName.trim() : "Cliente LegacyPay";
        // CPF fixo para Medusa - igual usado no painel
        const safePayerDocument = "36009722004";
        const safeDescription = (description && description.trim()) ? description.trim() : "Pagamento PIX - LegacyPay";

        const result = await client.createSimplePixPayment(
          amount * 100, // Converter para centavos
          safePayerName,
          safePayerDocument,
          "cliente@legacypay.com", // email fixo
          safeDescription,
          webhookUrl
        );

        // IMPORTANTE: insertId é o ID numerico usado nos webhooks da Medusa
        const medusaId = result.insertId || result.id;
        console.log("[Medusa createPixPayment] insertId:", result.insertId, "id:", result.id, "usando:", medusaId);

        return {
          success: true,
          transactionId: String(medusaId),
          qrCode: result.pix?.qrcode,
          copyPaste: result.pix?.qrcode,
          expiresAt: result.pix?.expirationDate,
          amount: (result.amount || amount * 100) / 100,
        };
      }

      default:
        return { success: false, error: `Adquirente ${config.code} não suportada` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao processar pagamento";
    console.error("[createPixPayment] Erro:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Converte o tipo de chave PIX do frontend para o formato da MisticPay
 */
function convertToMisticPayKeyType(keyType?: string): "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "CHAVE_ALEATORIA" | null {
  if (!keyType) return null;
  
  const normalized = keyType.toUpperCase().trim();
  
  switch (normalized) {
    case "CPF":
      return "CPF";
    case "CNPJ":
      return "CNPJ";
    case "EMAIL":
      return "EMAIL";
    case "TELEFONE":
    case "PHONE":
    case "CELULAR":
      return "TELEFONE";
    case "ALEATORIA":
    case "RANDOM":
    case "CHAVE_ALEATORIA":
    case "EVP":
    case "CHAVE":
      return "CHAVE_ALEATORIA";
    default:
      console.log(`[MisticPay] Tipo de chave desconhecido: ${keyType}, usando detecção automática`);
      return null;
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

        // MisticPay cobra R$ 0,50 de taxa por saque automaticamente
        // Então enviamos valor + taxa para que o cliente receba o valor correto
        // Ex: usuário quer receber R$ 80, enviamos R$ 80,50, MisticPay desconta R$ 0,50
        const MISTICPAY_WITHDRAWAL_FEE = 0.50;
        const amountToSend = amount + MISTICPAY_WITHDRAWAL_FEE;

        // Verificar saldo disponível na MisticPay antes de tentar o saque
        try {
          const balanceResult = await client.getBalance();
          console.log("[MisticPay] Saldo disponível:", balanceResult.data?.balance);
          
          if (balanceResult.success && balanceResult.data && balanceResult.data.balance < amountToSend) {
            return { 
              success: false, 
              error: `Saldo insuficiente na MisticPay. Disponível: R$ ${balanceResult.data.balance.toFixed(2)}, Necessário: R$ ${amountToSend.toFixed(2)}` 
            };
          }
        } catch (balanceError) {
          console.error("[MisticPay] Erro ao verificar saldo:", balanceError);
          // Continuar mesmo se não conseguir verificar o saldo
        }

        // Converter tipo de chave para formato MisticPay (CPF, CNPJ, EMAIL, TELEFONE, CHAVE_ALEATORIA)
        const misticPayKeyType = convertToMisticPayKeyType(pixKeyType) || mapPixKeyType(pixKey);
        console.log(`[MisticPay] Saque: valor líquido=${amount}, com taxa=${amountToSend}, pixKey=${pixKey}, tipo=${misticPayKeyType}`);

        const result = await client.withdraw({
          amount: amountToSend, // MisticPay recebe valor em REAIS, não centavos
          pixKey,
          pixKeyType: misticPayKeyType,
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
        // Verificar se a licenseKey está configurada (necessária para saques)
        if (!config.api_secret) {
          console.error("[Medusa] License key não configurada para saques");
          return { success: false, error: "License key da Medusa não configurada. Configure api_secret na adquirente." };
        }

        const client = new MedusaPayments({
          secretKey: config.api_key,
          licenseKey: config.api_secret
        });

        // Verificar saldo disponível na Medusa antes de tentar o saque
        try {
          const balanceCheck = await client.checkBalance();
          console.log("[Medusa] Saldo disponível:", balanceCheck.available / 100);
          
          if (balanceCheck.available < (amount * 100)) {
            return { 
              success: false, 
              error: `Saldo insuficiente na Medusa. Disponível: R$ ${(balanceCheck.available / 100).toFixed(2)}, Necessário: R$ ${amount.toFixed(2)}` 
            };
          }
        } catch (balanceError) {
          console.error("[Medusa] Erro ao verificar saldo:", balanceError);
          // Continuar mesmo se não conseguir verificar o saldo
        }

        // Buscar dados do usuário para o saque
        let beneficiaryName = "Cliente";
        let beneficiaryDocument = "00000000000";

        if (userId) {
          const userData = await sql`
            SELECT name, cpf_cnpj FROM profiles WHERE id = ${userId}
          `;
          if (userData.length > 0) {
            beneficiaryName = userData[0].name || "Cliente";
            beneficiaryDocument = (userData[0].cpf_cnpj || "00000000000").replace(/\D/g, "");
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

        console.log(`[Medusa] Iniciando saque: valor=${amount}, comTaxa=${amountToSend}, pixKey=${pixKey}, beneficiario=${beneficiaryName}`);

        try {
          const result = await client.requestSimpleWithdrawal(
            amountToSend * 100, // Converter para centavos
            pixKey,
            beneficiaryName,
            beneficiaryDocument,
            withdrawalWebhookUrl
          );

          console.log("[Medusa] Saque criado com sucesso:", result);

          return {
            success: true,
            withdrawalId: result.id,
            status: result.status,
          };
        } catch (withdrawError) {
          const errorMessage = withdrawError instanceof Error ? withdrawError.message : "Erro desconhecido ao processar saque";
          console.error("[Medusa] Erro ao criar saque:", errorMessage);
          return { success: false, error: errorMessage };
        }
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
        pixFixedFee: Number(acquirer.fixed_fee) || (routeType === 'white' ? 1.50 : 0),
        pixPercentageFee: Number(acquirer.fee_percentage) || (routeType === 'white' ? 0 : 4.00),
        withdrawalFee: Number(acquirer.withdrawal_fee) || defaultWithdrawalFee,
      };
    }

    // Taxas padrao por rota se nao encontrar adquirente
    // WHITE (MisticPay): 0% + R$ 1.50 fixo, R$ 2.00 saque
    // BLACK (Medusa): 4% + R$ 0.00 fixo, R$ 5.00 saque
    return routeType === 'white'
      ? { pixFixedFee: 1.50, pixPercentageFee: 0, withdrawalFee: 2.00 }
      : { pixFixedFee: 0, pixPercentageFee: 4.00, withdrawalFee: 5.00 };
  } catch (error) {
    console.error("[Acquirer] Erro ao buscar taxas:", error);
    return routeType === 'white'
      ? { pixFixedFee: 1.50, pixPercentageFee: 0, withdrawalFee: 2.00 }
      : { pixFixedFee: 0, pixPercentageFee: 4.00, withdrawalFee: 5.00 };
  }
}

/**
 * Busca taxas do sistema para um usuário específico
 * Considera taxas personalizadas do usuário se configuradas (deposito e saque)
 */
export async function getSystemFeesForUser(userId: string): Promise<FeeConfig> {
  try {
    // Buscar rota e taxas personalizadas do usuário
    const userResult = await sql`
      SELECT route_type, fee_percentage, fixed_fee, withdrawal_fee FROM profiles WHERE id = ${userId}
    `;
    
    const user = userResult[0];
    const routeType = (user?.route_type || 'black') as 'white' | 'black';
    
    // Buscar taxas padrão da rota
    const routeFees = await getSystemFeesByRoute(routeType);
    
    // Criar objeto de taxas com valores personalizados se existirem
    const fees: FeeConfig = {
      pixFixedFee: routeFees.pixFixedFee,
      pixPercentageFee: routeFees.pixPercentageFee,
      withdrawalFee: routeFees.withdrawalFee,
    };
    
    // Taxa percentual de deposito personalizada (PIX In)
    const userFeePercentage = user?.fee_percentage;
    if (userFeePercentage !== null && userFeePercentage !== undefined && String(userFeePercentage).trim() !== '') {
      fees.pixPercentageFee = Number(userFeePercentage);
    }
    
    // Taxa fixa de deposito personalizada (PIX In)
    const userFixedFee = user?.fixed_fee;
    if (userFixedFee !== null && userFixedFee !== undefined && String(userFixedFee).trim() !== '') {
      fees.pixFixedFee = Number(userFixedFee);
    }
    
    // Taxa de saque personalizada (PIX Out)
    const userWithdrawalFee = user?.withdrawal_fee;
    if (userWithdrawalFee !== null && userWithdrawalFee !== undefined && String(userWithdrawalFee).trim() !== '') {
      fees.withdrawalFee = Number(userWithdrawalFee);
    }
    
    console.log(`[Acquirer] Usuario ${userId} - DB: fee_percentage=${userFeePercentage}, fixed_fee=${userFixedFee}, withdrawal_fee=${userWithdrawalFee}`);
    console.log(`[Acquirer] Usuario ${userId} - FINAL: PIX In=${fees.pixPercentageFee}%+R$${fees.pixFixedFee}, PIX Out=R$${fees.withdrawalFee}`);
    
    return fees;
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
