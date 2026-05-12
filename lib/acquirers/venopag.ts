/**
 * Integracao com Venopag
 * Rota White - Taxa 1% deposito + 1% saque (real)
 * Margem LegacyPay: 2% deposito (total 3%), 3% saque (total 4%)
 * 
 * Documentacao: https://venopag.com
 */

const VENOPAG_API_URL = "https://venopag.com";

interface VenopagConfig {
  clientId: string;
  clientSecret: string;
}

interface VenopagCashInRequest {
  amount: number;
  name: string;
  document: string;
  description?: string;
  webhook_url?: string;
  splits?: Array<{
    username: string;
    percentage: number;
  }>;
}

interface VenopagCashInResponse {
  ok: boolean;
  qr_img?: string;
  copyPaste?: string;
  code?: string;
  request_number?: string;
  transaction_id?: string;
  error?: string;
}

interface VenopagConsultResponse {
  ok: boolean;
  status: "pending" | "confirmed" | "expired";
  error?: string;
}

interface VenopagCashOutRequest {
  amount: number;
  name: string;
  document: string;
  pix_key: string;
  pix_type: "EMAIL" | "CPF" | "CNPJ" | "PHONE" | "EVP";
  webhook_url?: string;
}

interface VenopagCashOutResponse {
  ok: boolean;
  e2e?: string;
  amount?: number;
  fee?: number;
  status?: string;
  error?: string;
}

export class Venopag {
  private clientId: string;
  private clientSecret: string;

  constructor(config: VenopagConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-Client-Id": this.clientId,
      "X-Client-Secret": this.clientSecret,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${VENOPAG_API_URL}${endpoint}`;

    console.log(`[Venopag] Request: ${options.method || "GET"} ${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    const responseText = await response.text();

    let data: T;
    try {
      data = JSON.parse(responseText) as T;
    } catch {
      console.error("[Venopag] Erro ao parsear JSON:", responseText.substring(0, 200));
      throw new Error(`Erro ao processar resposta da API Venopag`);
    }

    console.log(`[Venopag] Response:`, JSON.stringify(data).substring(0, 500));

    if (!response.ok) {
      const errorData = data as { error?: string; message?: string };
      const errorMessage = errorData.error || errorData.message || `Erro na API Venopag (${response.status})`;
      console.error("[Venopag] API Error:", errorMessage);
      throw new Error(errorMessage);
    }

    return data;
  }

  /**
   * Criar cobranca PIX (Cash In)
   * @param amount - Valor em reais (ex: 10.50)
   * @param name - Nome do pagador
   * @param document - CPF/CNPJ do pagador (apenas digitos)
   * @param description - Descricao do pagamento
   * @param webhookUrl - URL para receber webhooks
   */
  async createCashIn(
    amount: number,
    name: string,
    document: string,
    description?: string,
    webhookUrl?: string
  ): Promise<VenopagCashInResponse> {
    const payload: VenopagCashInRequest = {
      amount,
      name: name || "Cliente LegacyPay",
      document: document.replace(/\D/g, "") || "00000000000",
      description: description || "Deposito PIX - LegacyPay",
      webhook_url: webhookUrl,
    };

    return this.request<VenopagCashInResponse>("/api/cashin", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Consultar status de transacao
   * @param requestNumber - Numero da requisicao (vp_...)
   */
  async consultTransaction(requestNumber: string): Promise<VenopagConsultResponse> {
    return this.request<VenopagConsultResponse>(
      `/api/consult-transaction?request_number=${encodeURIComponent(requestNumber)}`,
      { method: "GET" }
    );
  }

  /**
   * Solicitar saque PIX (Cash Out)
   * @param amount - Valor em reais
   * @param name - Nome do beneficiario
   * @param document - CPF/CNPJ do beneficiario
   * @param pixKey - Chave PIX
   * @param pixType - Tipo da chave PIX
   * @param webhookUrl - URL para receber webhooks
   */
  async createCashOut(
    amount: number,
    name: string,
    document: string,
    pixKey: string,
    pixType: VenopagCashOutRequest["pix_type"],
    webhookUrl?: string
  ): Promise<VenopagCashOutResponse> {
    const payload: VenopagCashOutRequest = {
      amount,
      name: name || "Cliente LegacyPay",
      document: document.replace(/\D/g, "") || "00000000000",
      pix_key: pixKey,
      pix_type: pixType,
      webhook_url: webhookUrl,
    };

    return this.request<VenopagCashOutResponse>("/api/cashout", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Saque simplificado - detecta tipo da chave automaticamente
   */
  async createSimpleCashOut(
    amount: number,
    name: string,
    document: string,
    pixKey: string,
    webhookUrl?: string
  ): Promise<VenopagCashOutResponse> {
    const pixType = this.detectPixKeyType(pixKey);
    return this.createCashOut(amount, name, document, pixKey, pixType, webhookUrl);
  }

  /**
   * Detecta o tipo de chave PIX baseado no formato
   */
  private detectPixKeyType(pixKey: string): VenopagCashOutRequest["pix_type"] {
    const cleaned = pixKey.replace(/\D/g, "");

    // Email
    if (pixKey.includes("@")) {
      return "EMAIL";
    }

    // Telefone - E.164 ou apenas digitos com DDI+DDD
    if (pixKey.startsWith("+55") || (cleaned.length >= 10 && cleaned.length <= 13)) {
      // Verificar se comeca com DDD valido (11-99)
      const ddd = cleaned.substring(0, 2);
      if (parseInt(ddd) >= 11 && parseInt(ddd) <= 99) {
        // Verificar se o resto parece um celular (comeca com 9)
        if (cleaned.length === 11 && cleaned[2] === "9") {
          return "PHONE";
        }
      }
    }

    // CPF (11 digitos)
    if (cleaned.length === 11) {
      return "CPF";
    }

    // CNPJ (14 digitos)
    if (cleaned.length === 14) {
      return "CNPJ";
    }

    // Chave aleatoria (EVP) - UUID ou chave aleatoria de 32 caracteres hex
    return "EVP";
  }
}

/**
 * Mapeamento de status Venopag -> Status interno
 */
export const VENOPAG_STATUS_MAP: Record<string, string> = {
  pending: "pending",
  confirmed: "completed",
  expired: "expired",
  completed: "completed",
  failed: "failed",
};

// Singleton com configuracao do ambiente
let venopagInstance: Venopag | null = null;

export function getVenopag(clientId?: string, clientSecret?: string): Venopag {
  const id = clientId || process.env.VENOPAG_CLIENT_ID;
  const secret = clientSecret || process.env.VENOPAG_CLIENT_SECRET;

  if (!id || !secret) {
    throw new Error("Credenciais Venopag nao configuradas");
  }

  if (!venopagInstance || clientId) {
    venopagInstance = new Venopag({ clientId: id, clientSecret: secret });
  }

  return venopagInstance;
}

// Helper para usar adquirente do banco de dados
export async function createVenopagFromDb(
  acquirerConfig: Record<string, unknown>
): Promise<Venopag> {
  const clientId = acquirerConfig.api_key as string;
  const clientSecret = acquirerConfig.api_secret as string;

  if (!clientId || !clientSecret) {
    throw new Error("Credenciais Venopag nao configuradas na adquirente");
  }

  return new Venopag({ clientId, clientSecret });
}
