import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { CRYPTO_FEES } from "@/lib/coinremitter"

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
    
    // Buscar deposito pendente pelo endereco ou invoice
    const deposit = await sql`
      SELECT * FROM crypto_deposits 
      WHERE (address = ${address} OR external_id = ${invoice_id})
      AND status = 'pending'
      LIMIT 1
    `
    
    if (deposit.length === 0) {
      console.log("[Crypto Webhook] Deposito nao encontrado")
      return NextResponse.json({ status: "not_found" })
    }
    
    const depositRecord = deposit[0]
    
    // Atualizar deposito como confirmado
    await sql`
      UPDATE crypto_deposits 
      SET 
        status = 'confirmed',
        confirmations = ${confirmations},
        tx_hash = ${transaction_id},
        confirmed_at = NOW()
      WHERE id = ${depositRecord.id}
    `
    
    // Creditar saldo do usuario (converter crypto para BRL e aplicar taxa)
    const amountBRLBruto = Number(depositRecord.amount_brl)
    const fee = amountBRLBruto * (CRYPTO_FEES.DEPOSIT_FEE_PERCENT / 100)
    const amountBRL = amountBRLBruto - fee
    
    await sql`
      UPDATE profiles 
      SET balance = balance + ${amountBRL}
      WHERE id = ${depositRecord.user_id}
    `
    
    // Registrar transacao
    await sql`
      INSERT INTO transactions (user_id, type, amount, status, description, external_id)
      VALUES (
        ${depositRecord.user_id}, 
        'crypto_deposit', 
        ${amountBRL}, 
        'paid', 
        ${'Deposito ' + coin + ' - ' + amount + ' (Taxa: R$ ' + fee.toFixed(2) + ')'},
        ${transaction_id}
      )
    `
    
    // Registrar na tabela crypto_transactions
    await sql`
      INSERT INTO crypto_transactions (user_id, type, coin, amount_crypto, amount_brl, fee_brl, fee_crypto, wallet_address, tx_hash, status)
      VALUES (
        ${depositRecord.user_id},
        'deposit',
        ${coin},
        ${amount},
        ${amountBRL},
        ${fee},
        0,
        ${address},
        ${transaction_id},
        'confirmed'
      )
    `
    
    console.log(`[Crypto Webhook] Deposito confirmado: ${depositRecord.id}, creditado R$ ${amountBRL} (taxa R$ ${fee})`)
    
    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("[Crypto Webhook] Erro:", error)
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}
