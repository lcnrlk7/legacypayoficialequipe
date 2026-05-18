import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin) return accessDeniedResponse()

  try {
    // Buscar transacoes crypto
    const transactions = await sql`
      SELECT 
        ct.*,
        p.email as user_email
      FROM crypto_transactions ct
      LEFT JOIN profiles p ON ct.user_id = p.id
      ORDER BY ct.created_at DESC
      LIMIT 100
    `

    // Estatisticas gerais
    const statsResult = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount_brl ELSE 0 END), 0) as total_deposits_brl,
        COALESCE(COUNT(CASE WHEN type = 'deposit' THEN 1 END), 0) as total_deposits_count,
        COALESCE(SUM(CASE WHEN type = 'withdraw' THEN amount_brl ELSE 0 END), 0) as total_withdraws_brl,
        COALESCE(COUNT(CASE WHEN type = 'withdraw' THEN 1 END), 0) as total_withdraws_count,
        COALESCE(SUM(fee_brl), 0) as total_fees_brl,
        COALESCE(COUNT(CASE WHEN status = 'pending' AND type = 'deposit' THEN 1 END), 0) as pending_deposits,
        COALESCE(COUNT(CASE WHEN status = 'pending' AND type = 'withdraw' THEN 1 END), 0) as pending_withdraws
      FROM crypto_transactions
    `

    // Estatisticas de hoje
    const todayStats = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount_brl ELSE 0 END), 0) as today_deposits_brl,
        COALESCE(SUM(CASE WHEN type = 'withdraw' THEN amount_brl ELSE 0 END), 0) as today_withdraws_brl,
        COALESCE(SUM(fee_brl), 0) as today_fees_brl
      FROM crypto_transactions
      WHERE created_at >= CURRENT_DATE
    `

    const stats = {
      ...statsResult[0],
      ...todayStats[0],
    }

    return NextResponse.json({ transactions, stats })
  } catch (error) {
    console.error("Erro ao buscar dados crypto:", error)
    // Se tabela nao existe, retorna vazio
    return NextResponse.json({ 
      transactions: [], 
      stats: {
        total_deposits_brl: 0,
        total_deposits_count: 0,
        total_withdraws_brl: 0,
        total_withdraws_count: 0,
        total_fees_brl: 0,
        pending_deposits: 0,
        pending_withdraws: 0,
        today_deposits_brl: 0,
        today_withdraws_brl: 0,
        today_fees_brl: 0,
      }
    })
  }
}
