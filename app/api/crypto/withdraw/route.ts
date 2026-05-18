import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"
import { withdrawCrypto, validateAddress, convertBRLtoCrypto, SUPPORTED_COINS, CRYPTO_FEES, getCoinRate } from "@/lib/coinremitter"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
)

// Taxa de saque crypto (3% - inclui 0.23% do CoinRemitter)
const CRYPTO_WITHDRAW_FEE_PERCENT = CRYPTO_FEES.WITHDRAW_FEE_PERCENT

// Verificar autenticacao
async function verifyAuth(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload.sub as string
  } catch {
    return null
  }
}

// POST - Processar saque em crypto
export async function POST(request: NextRequest) {
  const userId = await verifyAuth()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const { coin, address, amountBRL } = await request.json()

    // Validacoes
    if (!coin || !address || !amountBRL) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      )
    }

    // Validar moeda
    if (!SUPPORTED_COINS.find((c) => c.id === coin)) {
      return NextResponse.json(
        { error: "Moeda nao suportada" },
        { status: 400 }
      )
    }

    // Obter cotacao e converter para verificar minimo
    const rate = await getCoinRate(coin, "BRL")
    const amountCrypto = amountBRL / rate
    const minCrypto = CRYPTO_FEES.MIN_WITHDRAW_CRYPTO[coin as keyof typeof CRYPTO_FEES.MIN_WITHDRAW_CRYPTO] || 0.0001

    // Verificar minimo em crypto
    if (amountCrypto < minCrypto) {
      return NextResponse.json(
        { error: `Valor minimo para saque: ${minCrypto} ${coin} (aprox. R$ ${(minCrypto * rate).toFixed(2)})` },
        { status: 400 }
      )
    }

    // Validar endereco
    const isValidAddress = await validateAddress(coin, address)
    if (!isValidAddress) {
      return NextResponse.json(
        { error: `Endereco ${coin} invalido` },
        { status: 400 }
      )
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Verificar saldo do usuario
    const user = await sql`
      SELECT id, balance FROM profiles WHERE id = ${userId}
    `

    if (user.length === 0) {
      return NextResponse.json(
        { error: "Usuario nao encontrado" },
        { status: 404 }
      )
    }

    const userBalance = Number(user[0].balance)
    
    // Calcular taxa
    const fee = amountBRL * (CRYPTO_WITHDRAW_FEE_PERCENT / 100)
    const totalDebit = amountBRL + fee

    if (userBalance < totalDebit) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Necessario: R$ ${totalDebit.toFixed(2)}, Disponivel: R$ ${userBalance.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Converter BRL para crypto
    const conversion = await convertBRLtoCrypto(coin, amountBRL)

    // Processar saque na CoinRemitter
    const withdrawal = await withdrawCrypto(coin, address, conversion.cryptoAmount)

    // Debitar saldo do usuario
    await sql`
      UPDATE profiles 
      SET balance = balance - ${totalDebit}
      WHERE id = ${userId}
    `

    // Registrar transacao
    await sql`
      INSERT INTO crypto_withdrawals (
        user_id, coin, address, amount_brl, amount_crypto, 
        fee_brl, rate, txid, status, created_at
      )
      VALUES (
        ${userId}, ${coin}, ${address}, ${amountBRL}, ${conversion.cryptoAmount},
        ${fee}, ${conversion.rate}, ${withdrawal.txid}, 'processing', NOW()
      )
    `

    return NextResponse.json({
      success: true,
      withdrawal: {
        txid: withdrawal.txid,
        explorerUrl: withdrawal.explorerUrl,
        amountBRL,
        amountCrypto: conversion.cryptoAmount,
        fee,
        totalDebit,
        rate: conversion.rate,
        coin,
        address,
        status: "processing",
      },
    })
  } catch (error) {
    console.error("[Crypto Withdraw] Erro:", error)
    return NextResponse.json(
      { error: "Erro ao processar saque crypto" },
      { status: 500 }
    )
  }
}

// GET - Historico de saques crypto
export async function GET() {
  const userId = await verifyAuth()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)

    const withdrawals = await sql`
      SELECT * FROM crypto_withdrawals 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      success: true,
      withdrawals,
    })
  } catch (error) {
    console.error("[Crypto Withdraw] Erro ao listar saques:", error)
    return NextResponse.json(
      { error: "Erro ao listar saques" },
      { status: 500 }
    )
  }
}
