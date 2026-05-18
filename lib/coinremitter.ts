/**
 * CoinRemitter API Integration
 * Documentacao: https://coinremitter.com/docs
 * API v1
 */

const COINREMITTER_API_URL = "https://api.coinremitter.com/v1"

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
  success: boolean
  data: T
}

/**
 * Fazer requisicao para a API do CoinRemitter v1
 * Headers: x-api-key e x-api-password
 */
async function apiRequest<T>(
  coin: string,
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const wallet = CRYPTO_WALLETS[coin]
  if (!wallet || !wallet.apiKey) {
    throw new Error(`Carteira ${coin} nao configurada`)
  }

  const response = await fetch(`${COINREMITTER_API_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "x-api-key": wallet.apiKey,
      "x-api-password": wallet.password,
    },
    body: JSON.stringify(params),
  })

  const data: ApiResponse<T> = await response.json()
  
  if (!data.success) {
    console.error(`[CoinRemitter] Erro na API ${endpoint}:`, data)
    throw new Error("Erro na API do CoinRemitter")
  }

  return data.data
}

/**
 * Obter saldo da carteira
 * POST https://api.coinremitter.com/v1/wallet/balance
 */
export async function getWalletBalance(coin: string) {
  const data = await apiRequest<{
    balance: string
    wallet_id: string
    wallet_name: string
    coin_symbol: string
    minimum_deposit_amount: string
  }>(coin, "wallet/balance")
  
  return {
    balance: parseFloat(data.balance),
    walletId: data.wallet_id,
    walletName: data.wallet_name,
    minDeposit: parseFloat(data.minimum_deposit_amount),
  }
}

/**
 * Criar endereco de deposito para usuario
 * POST https://api.coinremitter.com/v1/wallet/address/create
 */
export async function createDepositAddress(coin: string, label: string) {
  const data = await apiRequest<{
    address: string
    label: string
    qr_code: string
    minimum_deposit_amount: string
    expire_on: string
  }>(coin, "wallet/address/create", { label })

  return {
    address: data.address,
    label: data.label,
    qrCode: data.qr_code,
    minDeposit: parseFloat(data.minimum_deposit_amount),
    expiresAt: data.expire_on,
  }
}

/**
 * Validar endereco de carteira
 * POST https://api.coinremitter.com/v1/wallet/address/validate
 */
export async function validateAddress(coin: string, address: string) {
  try {
    const data = await apiRequest<{
      valid: boolean
    }>(coin, "wallet/address/validate", { address })
    return data.valid
  } catch {
    return false
  }
}

/**
 * Estimar custo de saque
 * POST https://api.coinremitter.com/v1/wallet/withdraw/estimate
 */
export async function estimateWithdrawCost(coin: string, amount: number, address?: string) {
  const params: Record<string, string> = { amount: amount.toString() }
  if (address) params.address = address
  
  const data = await apiRequest<{
    amount: string
    transaction_fee: string
    processing_fee: string
    total_amount: string
  }>(coin, "wallet/withdraw/estimate", params)

  return {
    amount: parseFloat(data.amount),
    transactionFee: parseFloat(data.transaction_fee),
    processingFee: parseFloat(data.processing_fee),
    totalAmount: parseFloat(data.total_amount),
  }
}

/**
 * Enviar crypto para endereco externo (saque)
 * POST https://api.coinremitter.com/v1/wallet/withdraw
 */
export async function withdrawCrypto(
  coin: string,
  address: string,
  amount: number
) {
  const data = await apiRequest<{
    id: string
    txid: string
    explorer_url: string
    amount: string
    transaction_fees: string
    processing_fees: string
    total_amount: string
    to_address: string
    date: string
  }>(coin, "wallet/withdraw", {
    address,
    amount: amount.toString(),
  })

  return {
    id: data.id,
    txid: data.txid,
    explorerUrl: data.explorer_url,
    amount: parseFloat(data.amount),
    transactionFees: parseFloat(data.transaction_fees),
    processingFees: parseFloat(data.processing_fees),
    totalAmount: parseFloat(data.total_amount),
    toAddress: data.to_address,
    date: data.date,
  }
}

/**
 * Verificar status de transacao
 * POST https://api.coinremitter.com/v1/wallet/transaction
 */
export async function getTransactionStatus(coin: string, txId: string) {
  const data = await apiRequest<{
    id: string
    txid: string
    confirmations: number
    required_confirmations: number
    status: string
    status_code: number
    type: string
    amount: string
    address: string
    date: string
  }>(coin, "wallet/transaction", { id: txId })

  return {
    id: data.id,
    txid: data.txid,
    confirmations: data.confirmations,
    requiredConfirmations: data.required_confirmations,
    status: data.status,
    statusCode: data.status_code,
    type: data.type,
    amount: parseFloat(data.amount),
    address: data.address,
    date: data.date,
  }
}

/**
 * Obter transacoes de um endereco
 * POST https://api.coinremitter.com/v1/wallet/address/transactions
 */
export async function getAddressTransactions(coin: string, address: string) {
  const data = await apiRequest<{
    address: string
    confirm_amount: string
    pending_amount: string
    transactions: Array<{
      id: string
      txid: string
      amount: string
      confirmations: number
      status: string
      date: string
    }>
  }>(coin, "wallet/address/transactions", { address })

  return {
    address: data.address,
    confirmedAmount: parseFloat(data.confirm_amount),
    pendingAmount: parseFloat(data.pending_amount),
    transactions: data.transactions.map(tx => ({
      id: tx.id,
      txid: tx.txid,
      amount: parseFloat(tx.amount),
      confirmations: tx.confirmations,
      status: tx.status,
      date: tx.date,
    })),
  }
}

/**
 * Obter cotacao atual usando API externa (CoinGecko)
 * CoinRemitter nao tem endpoint de cotacao direto
 */
export async function getCoinRate(coin: string, fiat: string = "BRL") {
  try {
    const coinIds: Record<string, string> = {
      BTC: "bitcoin",
      LTC: "litecoin",
    }
    
    const coinId = coinIds[coin] || coin.toLowerCase()
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${fiat.toLowerCase()}`
    )
    const data = await response.json()
    return data[coinId]?.[fiat.toLowerCase()] || 0
  } catch (error) {
    console.error("[CoinRemitter] Erro ao obter cotacao:", error)
    // Fallback: retornar cotacao aproximada
    if (coin === "BTC") return 500000 // ~R$ 500k
    if (coin === "LTC") return 500    // ~R$ 500
    return 0
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

/**
 * Criar invoice (fatura)
 * POST https://api.coinremitter.com/v1/invoice/create
 */
export async function createInvoice(
  coin: string,
  amount: number,
  options?: {
    name?: string
    email?: string
    description?: string
    notifyUrl?: string
    successUrl?: string
    failUrl?: string
    expiryMinutes?: number
    customData1?: string
    customData2?: string
  }
) {
  const params: Record<string, string> = {
    amount: amount.toString(),
  }
  
  if (options?.name) params.name = options.name
  if (options?.email) params.email = options.email
  if (options?.description) params.description = options.description
  if (options?.notifyUrl) params.notify_url = options.notifyUrl
  if (options?.successUrl) params.success_url = options.successUrl
  if (options?.failUrl) params.fail_url = options.failUrl
  if (options?.expiryMinutes) params.expiry_time_in_minutes = options.expiryMinutes.toString()
  if (options?.customData1) params.custom_data1 = options.customData1
  if (options?.customData2) params.custom_data2 = options.customData2

  const data = await apiRequest<{
    id: string
    invoice_id: string
    url: string
    amount: string
    status: string
    status_code: number
    expire_on: string
  }>(coin, "invoice/create", params)

  return {
    id: data.id,
    invoiceId: data.invoice_id,
    url: data.url,
    amount: parseFloat(data.amount),
    status: data.status,
    statusCode: data.status_code,
    expiresAt: data.expire_on,
  }
}

/**
 * Obter invoice
 * POST https://api.coinremitter.com/v1/invoice/get
 */
export async function getInvoice(coin: string, invoiceId: string) {
  const data = await apiRequest<{
    id: string
    invoice_id: string
    url: string
    amount: string
    status: string
    status_code: number
    paid_amount: { [key: string]: string }
    total_amount: { [key: string]: string }
  }>(coin, "invoice/get", { invoice_id: invoiceId })

  return {
    id: data.id,
    invoiceId: data.invoice_id,
    url: data.url,
    amount: parseFloat(data.amount),
    status: data.status,
    statusCode: data.status_code,
    paidAmount: data.paid_amount,
    totalAmount: data.total_amount,
  }
}
