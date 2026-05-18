import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

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
    
    // Creditar saldo do usuario (converter crypto para BRL)
    // Aqui voce pode implementar a logica de conversao
    const amountBRL = Number(depositRecord.amount_brl)
    
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
        ${'Deposito ' + coin + ' - ' + amount},
        ${transaction_id}
      )
    `
    
    console.log(`[Crypto Webhook] Deposito confirmado: ${depositRecord.id}, creditado R$ ${amountBRL}`)
    
    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("[Crypto Webhook] Erro:", error)
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}
