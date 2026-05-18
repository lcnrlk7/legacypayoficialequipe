import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"
import { createDepositAddress, getCoinRate, SUPPORTED_COINS } from "@/lib/coinremitter"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
)

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

// POST - Criar endereco de deposito
export async function POST(request: NextRequest) {
  const userId = await verifyAuth()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const { coin } = await request.json()

    // Validar moeda
    if (!SUPPORTED_COINS.find((c) => c.id === coin)) {
      return NextResponse.json(
        { error: "Moeda nao suportada" },
        { status: 400 }
      )
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Verificar se ja existe endereco para este usuario/moeda
    const existingAddress = await sql`
      SELECT * FROM crypto_addresses 
      WHERE user_id = ${userId} AND coin = ${coin} AND is_active = true
      LIMIT 1
    `

    if (existingAddress.length > 0) {
      const rate = await getCoinRate(coin, "BRL")
      return NextResponse.json({
        success: true,
        address: existingAddress[0].address,
        coin,
        rate,
        existing: true,
      })
    }

    // Criar novo endereco
    const label = `user_${userId}_${coin}_${Date.now()}`
    const addressData = await createDepositAddress(coin, label)
    const rate = await getCoinRate(coin, "BRL")

    // Salvar no banco
    await sql`
      INSERT INTO crypto_addresses (user_id, coin, address, label, created_at, is_active)
      VALUES (${userId}, ${coin}, ${addressData.address}, ${label}, NOW(), true)
    `

    return NextResponse.json({
      success: true,
      address: addressData.address,
      qrCode: addressData.qrCode,
      coin,
      rate,
      existing: false,
    })
  } catch (error) {
    console.error("[Crypto Deposit] Erro:", error)
    return NextResponse.json(
      { error: "Erro ao criar endereco de deposito" },
      { status: 500 }
    )
  }
}

// GET - Listar enderecos de deposito do usuario
export async function GET() {
  const userId = await verifyAuth()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)

    const addresses = await sql`
      SELECT * FROM crypto_addresses 
      WHERE user_id = ${userId} AND is_active = true
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      addresses,
    })
  } catch (error) {
    console.error("[Crypto Deposit] Erro ao listar enderecos:", error)
    return NextResponse.json(
      { error: "Erro ao listar enderecos" },
      { status: 500 }
    )
  }
}
