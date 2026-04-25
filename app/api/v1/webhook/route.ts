import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

// Configurar webhook
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
        { error: "API key inválida" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: "URL do webhook é obrigatória" },
        { status: 400 }
      )
    }

    // Validar URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: "URL inválida" },
        { status: 400 }
      )
    }

    // Atualizar webhook URL
    await sql`
      UPDATE profiles SET webhook_url = ${url} WHERE id = ${profile.id}
    `

    return NextResponse.json({
      success: true,
      data: {
        webhook_url: url,
        message: "Webhook configurado com sucesso"
      }
    })
  } catch (error) {
    console.error("[v0] Webhook config error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// Obter configuração de webhook
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
      SELECT webhook_url FROM profiles WHERE api_key = ${apiKey} AND is_active = true
    `
    const profile = profiles[0]

    if (!profile) {
      return NextResponse.json(
        { error: "API key inválida" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        webhook_url: profile.webhook_url
      }
    })
  } catch (error) {
    console.error("[v0] Webhook get error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// Remover webhook
export async function DELETE(request: NextRequest) {
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

    await sql`
      UPDATE profiles SET webhook_url = NULL WHERE id = ${profile.id}
    `

    return NextResponse.json({
      success: true,
      data: {
        message: "Webhook removido com sucesso"
      }
    })
  } catch (error) {
    console.error("[v0] Webhook delete error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
