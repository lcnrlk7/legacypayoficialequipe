/**
 * Payment Gateway Integration
 * Internal acquirer module
 */

import { sql } from "@/lib/db";

const BASE_URL = "https://api.misticpay.com/api";

interface MisticPayConfig {
  clientId: string;
  clientSecret: string;
}

interface CreatePixChargeParams {
  amount: number;
  payerName: string;
  payerDocument: string;
  transactionId: string;
  description: string;
  projectWebhook?: string;
}

interface CreatePixChargeResponse {
  success: boolean;
  data?: {
    transactionId: string;
    qrCode: string;
    qrCodeBase64: string;
    copyPaste: string;
    amount: number;
    fee: number;
    expiresAt?: string;
  };
  error?: string;
}

interface CheckTransactionResponse {
  success: boolean;
  data?: {
    transactionId: string;
    status: "PENDENTE" | "COMPLETO" | "FALHA";
    value: number;
    fee: number;
    transactionType: string;
    transactionMethod: string;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}

interface WithdrawParams {
  amount: number;
  pixKey: string;
  pixKeyType: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "CHAVE_ALEATORIA";
  description: string;
  projectWebhook?: string;
}

interface WithdrawResponse {
  success: boolean;
  data?: {
    jobId: string;
    transactionId: number;
    status: string;
    message: string;
  };
  error?: string;
}

interface BalanceResponse {
  success: boolean;
  data?: {
    balance: number;
  };
  error?: string;
}

export class MisticPay {
  private clientId: string;
  private clientSecret: string;

  constructor(config: MisticPayConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  private getHeaders(): HeadersInit {
    return {
      "ci": this.clientId,
      "cs": this.clientSecret,
      "Content-Type": "application/json",
    };
  }

  /**
   * Cria uma cobrança PIX (Cash-In)
   */
  async createPixCharge(params: CreatePixChargeParams): Promise<CreatePixChargeResponse> {
    try {
      const requestBody = {
        amount: params.amount,
        payerName: params.payerName,
        payerDocument: params.payerDocument.replace(/\D/g, ""),
        transactionId: params.transactionId,
        description: params.description,
        projectWebhook: params.projectWebhook,
      };

      const response = await fetch(`${BASE_URL}/transactions/create`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        console.error("[Gateway] Error response:", response.status, responseText);
        return {
          success: false,
          error: `Erro no provedor de pagamento: ${response.status}`,
        };
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error("[Gateway] Invalid JSON response:", responseText);
        return {
          success: false,
          error: "Resposta inválida do provedor de pagamento",
        };
      }

      // A resposta pode estar em result.data ou diretamente no result
      const data = result.data || result;

      if (data && (data.transactionId || data.qrcodeUrl || data.copyPaste)) {
        return {
          success: true,
          data: {
            transactionId: String(data.transactionId || params.transactionId),
            qrCode: data.qrcodeUrl || data.qrCode || "",
            qrCodeBase64: data.qrCodeBase64 || data.qrcodeBase64 || "",
            copyPaste: data.copyPaste || data.pixCopiaECola || "",
            amount: (data.transactionAmount || data.amount || params.amount * 100) / 100,
            fee: (data.transactionFee || data.fee || 0) / 100,
          },
        };
      }

      console.error("[Gateway] Unexpected response structure:", result);
      return {
        success: false,
        error: result.message || result.error || "Erro ao processar resposta do provedor",
      };
    } catch (error) {
      console.error("[Gateway] Connection error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro de conexão com o provedor de pagamento",
      };
    }
  }

  /**
   * Verifica o status de uma transação
   * Alias: getTransactionStatus
   */
  async checkTransaction(transactionId: string): Promise<CheckTransactionResponse> {
    try {
      const response = await fetch(`${BASE_URL}/transactions/check`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          transactionId: transactionId,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Erro no provedor de pagamento: ${response.status}`,
        };
      }

      const result = await response.json();

      if (result.transaction) {
        return {
          success: true,
          data: {
            transactionId: String(result.transaction.transactionId),
            status: result.transaction.transactionState as "PENDENTE" | "COMPLETO" | "FALHA",
            value: result.transaction.value,
            fee: result.transaction.fee,
            transactionType: result.transaction.transactionType,
            transactionMethod: result.transaction.transactionMethod,
            createdAt: result.transaction.createdAt,
            updatedAt: result.transaction.updatedAt,
          },
        };
      }

      return {
        success: false,
        error: result.message || "Transação não encontrada",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro de conexão com o provedor de pagamento",
      };
    }
  }

  /**
   * Alias para checkTransaction - mantém compatibilidade com outras adquirentes
   */
  async getTransactionStatus(transactionId: string) {
    const result = await this.checkTransaction(transactionId);
    if (result.success && result.data) {
      return {
        transactionState: result.data.status,
        status: result.data.status,
        value: result.data.value,
        fee: result.data.fee,
      };
    }
    return null;
  }

  /**
   * Solicita um saque PIX (Cash-Out)
   */
  async withdraw(params: WithdrawParams): Promise<WithdrawResponse> {
    try {
      const response = await fetch(`${BASE_URL}/transactions/withdraw`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          amount: params.amount,
          pixKey: params.pixKey,
          pixKeyType: params.pixKeyType,
          description: params.description,
          projectWebhook: params.projectWebhook,
        }),
      });

      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error("[Gateway] Invalid JSON response:", responseText);
        return {
          success: false,
          error: "Resposta inválida do provedor de pagamento",
        };
      }

      if (!response.ok) {
        console.error("[Gateway] Withdraw error:", response.status, result);
        
        let errorMessage = "Erro ao processar saque";
        
        if (result.message) {
          errorMessage = result.message;
        } else if (result.error) {
          errorMessage = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
        } else if (result.data?.message) {
          errorMessage = result.data.message;
        }

        if (response.status === 400 || response.status === 402) {
          if (errorMessage.toLowerCase().includes("saldo") || 
              errorMessage.toLowerCase().includes("balance") ||
              errorMessage.toLowerCase().includes("insufficient")) {
            errorMessage = "Saldo insuficiente na conta da adquirente";
          }
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      if (result.data) {
        return {
          success: true,
          data: {
            jobId: result.data.jobId,
            transactionId: result.data.transactionId,
            status: result.data.status,
            message: result.data.message,
          },
        };
      }

      if (result.success || result.transactionId) {
        return {
          success: true,
          data: {
            jobId: result.jobId || "",
            transactionId: result.transactionId,
            status: result.status || "QUEUED",
            message: result.message || "Saque em processamento",
          },
        };
      }

      return {
        success: false,
        error: result.message || result.error || "Erro ao processar saque",
      };
    } catch (error) {
      console.error("[Gateway] Connection error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro de conexão com o provedor de pagamento",
      };
    }
  }

  /**
   * Consulta o saldo disponível
   */
  async getBalance(): Promise<BalanceResponse> {
    try {
      const response = await fetch(`${BASE_URL}/users/balance`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Erro no provedor de pagamento: ${response.status}`,
        };
      }

      const result = await response.json();

      if (result.data) {
        return {
          success: true,
          data: {
            balance: result.data.balance,
          },
        };
      }

      return {
        success: false,
        error: result.message || "Erro ao consultar saldo",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro de conexão com o provedor de pagamento",
      };
    }
  }
}

/**
 * MISTIC STATUS (conforme documentação oficial)
 * - PENDENTE: Transação pendente, aguardando pagamento
 * - COMPLETO: Transação aprovada e concluída com sucesso
 * - FALHA: Transação falhou ou foi rejeitada
 * 
 * Mapeia o status da MisticPay para o status interno do sistema
 */
export function mapMisticPayStatus(status: string): string {
  const statusMap: Record<string, string> = {
    // Status MisticPay oficiais
    "PENDENTE": "pending",
    "COMPLETO": "completed", 
    "FALHA": "failed",
    // Status adicionais para compatibilidade
    "CANCELADO": "cancelled",
    "QUEUED": "processing",
  };
  return statusMap[status] || "pending";
}

/**
 * Mapeia o tipo de chave PIX para o formato da MisticPay
 */
export function mapPixKeyType(pixKey: string): "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "CHAVE_ALEATORIA" {
  const cleanKey = pixKey.replace(/\D/g, "");
  
  if (/^[0-9]{11}$/.test(cleanKey)) {
    return "CPF";
  }
  if (/^[0-9]{14}$/.test(cleanKey)) {
    return "CNPJ";
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) {
    return "EMAIL";
  }
  if (/^\+?[0-9]{10,13}$/.test(cleanKey)) {
    return "TELEFONE";
  }
  return "CHAVE_ALEATORIA";
}

/**
 * Factory para criar instância com credenciais do banco
 */
export async function createMisticPayClient(): Promise<MisticPay | null> {
  const acquirers = await sql`
    SELECT api_key, api_secret, api_url 
    FROM acquirers 
    WHERE code = 'misticpay' AND is_active = true
    LIMIT 1
  `;

  const acquirer = acquirers[0];
  if (!acquirer || !acquirer.api_key || !acquirer.api_secret) {
    return null;
  }

  return new MisticPay({
    clientId: acquirer.api_key,
    clientSecret: acquirer.api_secret,
  });
}
