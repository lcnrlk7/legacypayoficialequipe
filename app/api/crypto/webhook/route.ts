import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { CRYPTO_FEES, getCoinRate } from "@/lib/coinremitter"

const sql = neon(process.env.DATABASE_URL!)

// GET - Para validacao do CoinRemitter
export async function GET() {
  return new Response("OK", { 
    status: 200,
    headers: { "Content-Type": "text/plain" }
  })
}

// HEAD - Alguns servicos validam com HEAD
export async function HEAD() {
  return new Response(null, { status: 200 })
}

// POST - Recebe notificacoes de deposito/saque do CoinRemitter
// Formato: multipart/form-data ou application/json
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, any> = {}
    
    // CoinRemitter envia como multipart/form-data
    const contentType = request.headers.get("content-type") || ""
    
    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData()
      formData.forEach((value, key) => {
        body[key] = value
      })
    } else {
      body = await request.json()
    }
    
    console.log("[Crypto Webhook] Received:", JSON.stringify(body))
    
    // Dados que vem do CoinRemitter (formato do webhook)
    // {
    //   "id": "674edd35765xxxxxxxxxxxxxx",
    //   "txid": "1796b1185xxxxxxxx",
    //   "explorer_url": "https://...",
    //   "merchant_id": "...",
    //   "type": "receive", // ou "send"
    //   "coin_symbol": "BTC",
    //   "coin": "Bitcoin",
    //   "wallet_id": "...",
    //   "wallet_name": "...",
    //   "label": "...",
    //   "address": "xxx",
    //   "amount": "2",
    //   "confirmations": "3",
    //   "date": "2018-08-17 10:04:13",
    //   "date_timestamp": "1534480453"
    // }
    
    const {
      id,
      txid,
      type,           // "receive" ou "send"
      coin_symbol,    // "BTC", "LTC"
      coin,           // "Bitcoin", "Litecoin"
      address,
      amount,
      confirmations,
      label,
    } = body
    
    // Apenas processa depositos (type = "receive")
    if (type !== "receive") {
      console.log(`[Crypto Webhook] Tipo ${type}, ignorando (apenas 'receive' e processado)`)
      return NextResponse.json({ status: "ignored" })
    }
    
    // Buscar endereco cadastrado para este usuario
    const addressRecord = await sql`
      SELECT ca.user_id, cd.id as deposit_id
      FROM crypto_addresses ca
      LEFT JOIN crypto_deposits cd ON ca.address = cd.address AND cd.status = 'pending'
      WHERE ca.address = ${address}
      LIMIT 1
    `
    
    if (addressRecord.length === 0) {
      console.log("[Crypto Webhook] Endereco nao encontrado:", address)
      return NextResponse.json({ status: "address_not_found" })
    }
    
    const record = addressRecord[0]
    const userId = record.user_id
    
    if (!userId) {
      console.log("[Crypto Webhook] Usuario nao encontrado para endereco:", address)
      return NextResponse.json({ status: "user_not_found" })
    }
    
    // Calcular valor em BRL baseado na cotacao atual
    const coinSymbol = coin_symbol || coin?.substring(0, 3).toUpperCase() || "BTC"
    const rate = await getCoinRate(coinSymbol, "BRL")
    const amountCrypto = parseFloat(amount)
    const amountBRLBruto = amountCrypto * rate
    const fee = amountBRLBruto * (CRYPTO_FEES.DEPOSIT_FEE_PERCENT / 100)
    const amountBRL = amountBRLBruto - fee
    
    // Verificar se ja processamos esta transacao (evitar duplicatas)
    const existingTx = await sql`
      SELECT id FROM crypto_transactions WHERE tx_hash = ${txid} LIMIT 1
    `
    
    if (existingTx.length > 0) {
      console.log("[Crypto Webhook] Transacao ja processada:", txid)
      return NextResponse.json({ status: "already_processed" })
    }
    
    // Atualizar deposito como confirmado ou criar novo se nao existir
    if (record.deposit_id) {
      await sql`
        UPDATE crypto_deposits 
        SET 
          status = 'confirmed',
          amount_crypto = ${amountCrypto},
          amount_brl = ${amountBRL},
          rate = ${rate},
          confirmations = ${parseInt(confirmations) || 0},
          tx_hash = ${txid},
          confirmed_at = NOW()
        WHERE id = ${record.deposit_id}
      `
    } else {
      await sql`
        INSERT INTO crypto_deposits (user_id, coin, address, amount_crypto, amount_brl, rate, status, tx_hash, confirmations, created_at, confirmed_at)
        VALUES (${userId}, ${coinSymbol}, ${address}, ${amountCrypto}, ${amountBRL}, ${rate}, 'confirmed', ${txid}, ${parseInt(confirmations) || 0}, NOW(), NOW())
      `
    }
    
    // Creditar saldo do usuario
    await sql`
      UPDATE profiles 
      SET balance = balance + ${amountBRL}
      WHERE id = ${userId}
    `
    
    // Registrar transacao
    await sql`
      INSERT INTO transactions (user_id, type, amount, status, description, external_id)
      VALUES (
        ${userId}, 
        'crypto_deposit', 
        ${amountBRL}, 
        'paid', 
        ${'Deposito ' + coinSymbol + ' - ' + amountCrypto.toFixed(8) + ' ' + coinSymbol + ' (Taxa: R$ ' + fee.toFixed(2) + ')'},
        ${txid}
      )
    `
    
    // Registrar na tabela crypto_transactions
    await sql`
      INSERT INTO crypto_transactions (user_id, type, coin, amount_crypto, amount_brl, fee_brl, fee_crypto, wallet_address, tx_hash, status)
      VALUES (
        ${userId},
        'deposit',
        ${coinSymbol},
        ${amountCrypto},
        ${amountBRL},
        ${fee},
        0,
        ${address},
        ${txid},
        'confirmed'
      )
    `
    
    console.log(`[Crypto Webhook] Deposito confirmado para user ${userId}: ${amountCrypto} ${coinSymbol} = R$ ${amountBRL.toFixed(2)} (taxa R$ ${fee.toFixed(2)})`)
    
    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("[Crypto Webhook] Erro:", error)
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}
