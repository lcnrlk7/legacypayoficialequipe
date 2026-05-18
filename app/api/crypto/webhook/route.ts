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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("[Crypto Webhook] Received:", JSON.stringify(body))
    
    // Dados que vem do CoinRemitter
    const {
      id,
      invoice_id,
      address,
      amount,
      coin,
      status,
      type, // "receive" ou "send"
      confirmations,
      transaction_id,
    } = body
    
    // Apenas processa se status for "confirm" (pagamento confirmado)
    if (status !== "confirm") {
      console.log(`[Crypto Webhook] Status ${status}, ignorando...`)
      return NextResponse.json({ status: "ignored" })
    }
    
    // Buscar endereco cadastrado para este usuario
    const addressRecord = await sql`
      SELECT ca.*, cd.id as deposit_id, cd.user_id 
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
    
    // Calcular valor em BRL baseado na cotacao atual
    const rate = await getCoinRate(coin, "BRL")
    const amountCrypto = parseFloat(amount)
    const amountBRLBruto = amountCrypto * rate
    const fee = amountBRLBruto * (CRYPTO_FEES.DEPOSIT_FEE_PERCENT / 100)
    const amountBRL = amountBRLBruto - fee
    
    // Atualizar deposito como confirmado ou criar novo se nao existir
    if (record.deposit_id) {
      await sql`
        UPDATE crypto_deposits 
        SET 
          status = 'confirmed',
          amount_crypto = ${amountCrypto},
          amount_brl = ${amountBRL},
          rate = ${rate},
          confirmations = ${confirmations},
          tx_hash = ${transaction_id},
          confirmed_at = NOW()
        WHERE id = ${record.deposit_id}
      `
    } else {
      await sql`
        INSERT INTO crypto_deposits (user_id, coin, address, amount_crypto, amount_brl, rate, status, tx_hash, confirmations, created_at, confirmed_at)
        VALUES (${userId}, ${coin}, ${address}, ${amountCrypto}, ${amountBRL}, ${rate}, 'confirmed', ${transaction_id}, ${confirmations}, NOW(), NOW())
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
        ${'Deposito ' + coin + ' - ' + amountCrypto.toFixed(8) + ' ' + coin + ' (Taxa: R$ ' + fee.toFixed(2) + ')'},
        ${transaction_id}
      )
    `
    
    // Registrar na tabela crypto_transactions
    await sql`
      INSERT INTO crypto_transactions (user_id, type, coin, amount_crypto, amount_brl, fee_brl, fee_crypto, wallet_address, tx_hash, status)
      VALUES (
        ${userId},
        'deposit',
        ${coin},
        ${amountCrypto},
        ${amountBRL},
        ${fee},
        0,
        ${address},
        ${transaction_id},
        'confirmed'
      )
    `
    
    console.log(`[Crypto Webhook] Deposito confirmado para user ${userId}: ${amountCrypto} ${coin} = R$ ${amountBRL.toFixed(2)} (taxa R$ ${fee.toFixed(2)})`)
    
    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("[Crypto Webhook] Erro:", error)
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}
