import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

// POST - Aceitar contrato e gerar pagamento
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  const userId = session.id

  try {
    const { accepted } = await request.json()
    
    if (!accepted) {
      return NextResponse.json({ error: "Voce precisa aceitar o contrato" }, { status: 400 })
    }

    // Verificar se ja tem tenant
    const existing = await sql`
      SELECT * FROM white_label_tenants WHERE user_id = ${userId} LIMIT 1
    `

    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    if (existing.length > 0) {
      // Atualizar contrato aceito
      await sql`
        UPDATE white_label_tenants 
        SET 
          contract_accepted = true,
          contract_accepted_at = NOW(),
          contract_ip = ${clientIp}
        WHERE user_id = ${userId}
      `
    } else {
      // Criar novo tenant com contrato aceito
      await sql`
        INSERT INTO white_label_tenants (
          user_id, name, slug, contract_accepted, contract_accepted_at, contract_ip,
          setup_fee, monthly_fee, setup_paid, subscription_status
        )
        VALUES (
          ${userId}, 'Nova Plataforma', ${`plataforma-${Date.now()}`}, true, NOW(), ${clientIp},
          350.00, 50.00, false, 'pending'
        )
      `
    }

    return NextResponse.json({
      success: true,
      message: "Contrato aceito com sucesso",
    })
  } catch (error: any) {
    console.error("[White Label Contract] Erro:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
