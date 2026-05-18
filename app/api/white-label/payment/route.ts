import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
)

const sql = neon(process.env.DATABASE_URL!)

async function verifyAuth(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return (payload.id || payload.sub) as string
  } catch {
    return null
  }
}

// POST - Gerar pagamento (setup ou mensalidade)
export async function POST(request: NextRequest) {
  const userId = await verifyAuth()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const { type } = await request.json() // "setup" ou "monthly"
    
    // Buscar tenant
    const tenants = await sql`
      SELECT * FROM white_label_tenants WHERE user_id = ${userId} LIMIT 1
    `
    
    if (tenants.length === 0) {
      return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 })
    }

    const tenant = tenants[0]
    const amount = type === "setup" ? tenant.setup_fee : tenant.monthly_fee

    // Gerar PIX usando a API interna do Hyperion Pay
    const pixResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://app.hyperionpay.com.br"}/api/v1/pix/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.HYPERION_INTERNAL_API_KEY || "",
      },
      body: JSON.stringify({
        amount: amount,
        description: type === "setup" 
          ? `White Label - Taxa de Setup - ${tenant.name}`
          : `White Label - Mensalidade - ${tenant.name}`,
        customer: {
          name: "White Label",
          document: "00000000000",
        },
        metadata: {
          type: "white_label",
          payment_type: type,
          tenant_id: tenant.id,
          user_id: userId,
        },
      }),
    })

    const pixData = await pixResponse.json()

    if (!pixData.success) {
      // Fallback: gerar codigo PIX manual para teste
      const pixCode = `00020126580014br.gov.bcb.pix0136${tenant.id}5204000053039865404${amount.toFixed(2)}5802BR5913HyperionPay6009SAO PAULO62070503***6304`
      
      // Salvar pagamento pendente
      await sql`
        INSERT INTO white_label_payments (tenant_id, user_id, type, amount, status, pix_code, expires_at)
        VALUES (${tenant.id}, ${userId}, ${type}, ${amount}, 'pending', ${pixCode}, NOW() + INTERVAL '30 minutes')
      `

      return NextResponse.json({
        success: true,
        pixCode,
        amount,
        message: "Pagamento gerado. Copie o codigo PIX e pague.",
      })
    }

    // Salvar pagamento pendente
    await sql`
      INSERT INTO white_label_payments (tenant_id, user_id, type, amount, status, external_id, pix_code, pix_qrcode, expires_at)
      VALUES (${tenant.id}, ${userId}, ${type}, ${amount}, 'pending', ${pixData.transaction_id}, ${pixData.pix_code}, ${pixData.qr_code_base64}, NOW() + INTERVAL '30 minutes')
    `

    return NextResponse.json({
      success: true,
      pixCode: pixData.pix_code,
      qrCode: pixData.qr_code_base64,
      amount,
      transactionId: pixData.transaction_id,
    })
  } catch (error: any) {
    console.error("[White Label Payment] Erro:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET - Verificar status do pagamento
export async function GET(request: NextRequest) {
  const userId = await verifyAuth()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const payments = await sql`
      SELECT * FROM white_label_payments 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      success: true,
      payments,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
