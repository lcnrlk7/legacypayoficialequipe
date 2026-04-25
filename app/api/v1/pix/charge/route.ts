import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

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

    const body = await request.json()
    const { amount, description, expiration_minutes = 30 } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valor inválido" },
        { status: 400 }
      )
    }

    // Criar cobrança PIX
    const expirationDate = new Date()
    expirationDate.setMinutes(expirationDate.getMinutes() + expiration_minutes)

    const chargeId = crypto.randomUUID()
    const copyPaste = `00020126580014br.gov.bcb.pix0136${chargeId}5204000053039865802BR5925LEGACYPAY PAGAMENTOS6009SAO PAULO62070503***6304`

    const charges = await sql`
      INSERT INTO pix_charges (user_id, amount, description, expiration, copy_paste, qr_code, external_id, status)
      VALUES (
        ${profile.id}, 
        ${amount}, 
        ${description || null}, 
        ${expirationDate.toISOString()}, 
        ${copyPaste},
        ${'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(copyPaste)},
        ${chargeId},
        'active'
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
        amount: charge.amount,
        description: charge.description,
        status: charge.status,
        qr_code: charge.qr_code,
        copy_paste: charge.copy_paste,
        expiration: charge.expiration,
        created_at: charge.created_at
      }
    })
  } catch (error) {
    console.error("[v0] PIX charge error:", error)
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
