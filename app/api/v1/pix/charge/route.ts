import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { createPixPayment, getSystemFeesForUser } from "@/lib/acquirers"

// Criar cobrança PIX
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key")
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key não fornecida" },
        { status: 401 }
      )
    }

    const profiles = await sql`
      SELECT * FROM profiles WHERE api_key = ${apiKey} AND is_active = true
    `
    const profile = profiles[0]

    if (!profile) {
      return NextResponse.json(
        { error: "API key inválida ou conta inativa" },
        { status: 401 }
      )
    }

    // Verificar KYC
    if (profile.kyc_status !== "approved") {
      return NextResponse.json(
        { error: "KYC não aprovado. Complete a verificação no dashboard." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { amount, description, payer_name, payer_document } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valor inválido" },
        { status: 400 }
      )
    }

    if (amount < 1) {
      return NextResponse.json(
        { error: "Valor mínimo é R$ 1,00" },
        { status: 400 }
      )
    }

    if (amount > 50000) {
      return NextResponse.json(
        { error: "Valor máximo é R$ 50.000,00" },
        { status: 400 }
      )
    }

    // Buscar taxas baseadas na rota do usuário
    const systemFees = await getSystemFeesForUser(profile.id)
    
    // Calcular taxa
    const feePercentage = systemFees.pixPercentageFee
    const fixedFee = systemFees.pixFixedFee
    const percentageFee = (amount * feePercentage) / 100
    const fee = percentageFee + fixedFee
    const netAmount = amount - fee

    const chargeId = `charge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Criar cobrança PIX usando a adquirente correta para a rota do usuário
    const pixResponse = await createPixPayment(
      amount,
      chargeId,
      profile.id,
      description || `Pagamento via ${profile.name}`,
      payer_name || "Cliente",
      payer_document || "00000000000"
    )

    if (!pixResponse.success) {
      return NextResponse.json(
        { error: pixResponse.error || "Erro ao criar cobrança PIX" },
        { status: 500 }
      )
    }

    // Salvar cobrança no banco
    const expirationDate = new Date()
    expirationDate.setMinutes(expirationDate.getMinutes() + 30)

    const charges = await sql`
      INSERT INTO pix_charges (
        user_id, amount, fee, net_amount, description, expiration, 
        copy_paste, qr_code, external_id, acquirer_transaction_id, status
      )
      VALUES (
        ${profile.id}, 
        ${amount},
        ${fee},
        ${netAmount},
        ${description || null}, 
        ${expirationDate.toISOString()}, 
        ${pixResponse.copyPaste || pixResponse.data?.copyPaste || ''},
        ${pixResponse.qrCodeBase64 || pixResponse.data?.qrCodeBase64 || pixResponse.qrCode || pixResponse.data?.qrCode || ''},
        ${chargeId},
        ${pixResponse.transactionId || pixResponse.data?.transactionId || ''},
        'pending'
      )
      RETURNING *
    `
    const charge = charges[0]

    // Log da API
    await sql`
      INSERT INTO api_logs (user_id, endpoint, method, request_body, response_status, ip_address)
      VALUES (${profile.id}, '/api/v1/pix/charge', 'POST', ${JSON.stringify(body)}, 200, ${request.headers.get("x-forwarded-for") || "unknown"})
    `

    return NextResponse.json({
      success: true,
      data: {
        id: charge.id,
        external_id: charge.external_id,
        amount: Number(charge.amount),
        fee: Number(charge.fee),
        net_amount: Number(charge.net_amount),
        description: charge.description,
        status: charge.status,
        route: profile.route_type,
        qr_code: charge.qr_code,
        copy_paste: charge.copy_paste,
        expiration: charge.expiration,
        created_at: charge.created_at
      }
    })
  } catch (error) {
    console.error("[PIX Charge] Error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// Listar cobranças
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key")
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key não fornecida" },
        { status: 401 }
      )
    }

    const profiles = await sql`
      SELECT * FROM profiles WHERE api_key = ${apiKey} AND is_active = true
    `
    const profile = profiles[0]

    if (!profile) {
      return NextResponse.json(
        { error: "API key inválida" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let charges
    if (status) {
      charges = await sql`
        SELECT * FROM pix_charges 
        WHERE user_id = ${profile.id} AND status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      charges = await sql`
        SELECT * FROM pix_charges 
        WHERE user_id = ${profile.id}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return NextResponse.json({
      success: true,
      data: charges,
      pagination: {
        limit,
        offset,
        total: charges.length
      }
    })
  } catch (error) {
    console.error("[v0] PIX charge list error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
