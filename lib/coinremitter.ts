/**
 * CoinRemitter API Integration
 * Documentacao: https://coinremitter.com/docs
 */

const COINREMITTER_API_URL = "https://coinremitter.com/api/v3"

interface CoinRemitterWallet {
  apiKey: string
  password: string
  coin: string
}

// Configuracao das carteiras
export const CRYPTO_WALLETS: Record<string, CoinRemitterWallet> = {
  BTC: {
    apiKey: process.env.COINREMITTER_BTC_API_KEY || "",
    password: process.env.COINREMITTER_BTC_PASSWORD || "",
    coin: "BTC",
  },
  LTC: {
    apiKey: process.env.COINREMITTER_LTC_API_KEY || "",
    password: process.env.COINREMITTER_LTC_PASSWORD || "",
    coin: "LTC",
  },
}

// Moedas suportadas
export const SUPPORTED_COINS = [
  { id: "BTC", name: "Bitcoin", icon: "₿", color: "#F7931A" },
  { id: "LTC", name: "Litecoin", icon: "Ł", color: "#345D9D" },
]

// Taxas da plataforma (em cima dos 0.23% do CoinRemitter)
export const CRYPTO_FEES = {
  DEPOSIT_FEE_PERCENT: 2.5,    // Taxa de deposito: 2.5%
  WITHDRAW_FEE_PERCENT: 3.0,   // Taxa de saque: 3%
  // Minimos em crypto (valores baixos para permitir transacoes pequenas)
  MIN_WITHDRAW_CRYPTO: {
    BTC: 0.0001,   // ~R$ 50 em BTC
    LTC: 0.01,     // ~R$ 5 em LTC
  },
  MIN_DEPOSIT_CRYPTO: {
    BTC: 0.00005,  // ~R$ 25 em BTC
    LTC: 0.005,    // ~R$ 2.50 em LTC
  },
}

interface ApiResponse<T> {
  flag: number
  msg: string
  action: string
  data: T
}

/**
 * Fazer requisicao para a API do CoinRemitter
 */
async function apiRequest<T>(
  coin: string,
  endpoint: string,
  params: Record<string, string> = {}
): Promise<ApiResponse<T>> {
  const wallet = CRYPTO_WALLETS[coin]
  if (!wallet || !wallet.apiKey) {
    throw new Error(`Carteira ${coin} nao configurada`)
  }

  const response = await fetch(`${COINREMITTER_API_URL}/${coin}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: wallet.apiKey,
      password: wallet.password,
      ...params,
    }),
  })

  const data = await response.json()
  
  if (data.flag !== 1) {
    console.error(`[CoinRemitter] Erro na API ${coin}/${endpoint}:`, data)
    throw new Error(data.msg || "Erro na API do CoinRemitter")
  }

  return data
}

/**
 * Obter saldo da carteira
 */
export async function getWalletBalance(coin: string) {
  const response = await apiRequest<{
    balance: string
    available_balance: string
    pending_balance: string
  }>(coin, "get-balance")
  
  return {
    balance: parseFloat(response.data.balance),
    available: parseFloat(response.data.available_balance),
    pending: parseFloat(response.data.pending_balance),
  }
}

/**
 * Criar endereco de deposito para usuario
 */
export async function createDepositAddress(coin: string, label: string) {
  const response = await apiRequest<{
    address: string
    label: string
    qr_code: string
  }>(coin, "get-new-address", { label })

  return {
    address: response.data.address,
    label: response.data.label,
    qrCode: response.data.qr_code,
  }
}

/**
 * Obter cotacao atual
 */
export async function getCoinRate(coin: string, fiat: string = "BRL") {
  const response = await apiRequest<{
    price: string
  }>(coin, "get-coin-rate", { fiat })

  return parseFloat(response.data.price)
}

/**
 * Enviar crypto para endereco externo (saque)
 */
export async function withdrawCrypto(
  coin: string,
  address: string,
  amount: number
) {
  const response = await apiRequest<{
    id: string
    txid: string
    explorer_url: string
    amount: string
    transaction_fees: string
    processing_fees: string
    total_amount: string
    status: string
  }>(coin, "withdraw", {
    address,
    amount: amount.toString(),
  })

  return {
    id: response.data.id,
    txid: response.data.txid,
    explorerUrl: response.data.explorer_url,
    amount: parseFloat(response.data.amount),
    fees: parseFloat(response.data.transaction_fees) + parseFloat(response.data.processing_fees),
    totalAmount: parseFloat(response.data.total_amount),
    status: response.data.status,
  }
}

/**
 * Verificar status de transacao
 */
export async function getTransactionStatus(coin: string, txId: string) {
  const response = await apiRequest<{
    id: string
    txid: string
    confirmations: number
    status: string
    amount: string
  }>(coin, "get-transaction", { id: txId })

  return {
    id: response.data.id,
    txid: response.data.txid,
    confirmations: response.data.confirmations,
    status: response.data.status,
    amount: parseFloat(response.data.amount),
  }
}

/**
 * Validar endereco de carteira
 */
export async function validateAddress(coin: string, address: string) {
  try {
    const response = await apiRequest<{
      valid: boolean
    }>(coin, "validate-address", { address })
    return response.data.valid
  } catch {
    return false
  }
}

/**
 * Converter BRL para Crypto
 */
export async function convertBRLtoCrypto(coin: string, brlAmount: number) {
  const rate = await getCoinRate(coin, "BRL")
  const cryptoAmount = brlAmount / rate
  return {
    brlAmount,
    cryptoAmount,
    rate,
    coin,
  }
}

/**
 * Converter Crypto para BRL
 */
export async function convertCryptoToBRL(coin: string, cryptoAmount: number) {
  const rate = await getCoinRate(coin, "BRL")
  const brlAmount = cryptoAmount * rate
  return {
    cryptoAmount,
    brlAmount,
    rate,
    coin,
  }
}
