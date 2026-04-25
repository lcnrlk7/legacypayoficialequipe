/**
 * Integração com Promisse Pay
 * Documentação: https://api.promisse.com.br
 */

const PROMISSE_API_URL = "https://api.promisse.com.br";

interface PromissePayConfig {
  apiKey: string;
}

interface PromisseTransactionResponse {
  id: string;
  status: string;
  amount: number;
  pixCode?: string;
  pixQrCode?: string;
  expiresAt?: string;
  paidAt?: string;
  error?: string;
}

interface PromisseWithdrawalResponse {
  id: string;
  status: string;
  amount: number;
  pixKey: string;
  processedAt?: string;
  error?: string;
}

interface PromisseBalanceResponse {
  balance: number;
  available: number;
  pending: number;
}

export class PromissePay {
  private apiKey: string;

  constructor(config: PromissePayConfig) {
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${PROMISSE_API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[PromissePay] API Error:", data);
      throw new Error(data.message || data.error || "Erro na API Promisse Pay");
    }

    return data as T;
  }

  /**
   * Consultar saldo da conta
   */
  async checkBalance(): Promise<PromisseBalanceResponse> {
    return this.request<PromisseBalanceResponse>("/check-balance", {
      method: "GET",
    });
  }

  /**
   * Criar pagamento PIX (QR Code)
   * @param amount - Valor em centavos
   * @param externalId - ID externo para referência
   */
  async createPixPayment(
    amount: number,
    externalId?: string
  ): Promise<PromisseTransactionResponse> {
    const payload: Record<string, unknown> = {
      amount,
    };

    if (externalId) {
      payload.externalId = externalId;
    }

    return this.request<PromisseTransactionResponse>("/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Consultar status de uma transação
   * @param transactionId - ID da transação
   */
  async getTransaction(
    transactionId: string
  ): Promise<PromisseTransactionResponse> {
    return this.request<PromisseTransactionResponse>(
      `/transactions/${transactionId}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Solicitar saque PIX
   * @param amount - Valor em centavos
   * @param pixKey - Chave PIX do destinatário
   */
  async requestWithdrawal(
    amount: number,
    pixKey: string
  ): Promise<PromisseWithdrawalResponse> {
    return this.request<PromisseWithdrawalResponse>("/withdrawals", {
      method: "POST",
      body: JSON.stringify({
        amount,
        pixKey,
      }),
    });
  }

  /**
   * Consultar status de um saque
   * @param withdrawalId - ID do saque
   */
  async getWithdrawal(
    withdrawalId: string
  ): Promise<PromisseWithdrawalResponse> {
    return this.request<PromisseWithdrawalResponse>(
      `/transactions/${withdrawalId}`,
      {
        method: "GET",
      }
    );
  }
}

// Instância singleton com configuração do ambiente
let promissePayInstance: PromissePay | null = null;

export function getPromissePay(apiKey?: string): PromissePay {
  const key = apiKey || process.env.PROMISSEPAY_API_KEY;

  if (!key) {
    throw new Error("PROMISSEPAY_API_KEY não configurada");
  }

  if (!promissePayInstance || apiKey) {
    promissePayInstance = new PromissePay({ apiKey: key });
  }

  return promissePayInstance;
}

// Helper para usar adquirente do banco de dados
export async function createPromissePayFromDb(
  acquirerConfig: Record<string, unknown>
): Promise<PromissePay> {
  const apiKey = acquirerConfig.api_key as string;

  if (!apiKey) {
    throw new Error("API Key da Promisse Pay não configurada");
  }

  return new PromissePay({ apiKey });
}
