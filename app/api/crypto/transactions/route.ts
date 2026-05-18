import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
)

export async function GET(request: NextRequest) {
  try {
    // Verificar auth
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.userId as string

    const sql = neon(process.env.DATABASE_URL!)

    // Buscar depositos
    const deposits = await sql`
      SELECT 
        id,
        'deposit' as type,
        coin,
        amount_crypto,
        amount_brl,
        address,
        status,
        created_at
      FROM crypto_deposits
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 20
    `

    // Buscar saques
    const withdrawals = await sql`
      SELECT 
        id,
        'withdraw' as type,
        coin,
        amount_crypto,
        amount_brl,
        address,
        status,
        txid,
        created_at
      FROM crypto_withdrawals
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 20
    `

    // Combinar e ordenar
    const transactions = [...deposits, ...withdrawals]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30)

    return NextResponse.json({
      success: true,
      transactions,
    })
  } catch (error) {
    console.error("[Crypto Transactions] Error:", error)
    return NextResponse.json({ transactions: [] })
  }
}
