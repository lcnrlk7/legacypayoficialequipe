import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"
import crypto from "crypto"

const MAX_INTEGRATIONS = 7

// Gerar credenciais seguras
function generateClientId(): string {
  return `lp_${uuidv4().replace(/-/g, "").substring(0, 24)}`
}

function generateClientSecret(): string {
  return `sk_${crypto.randomBytes(32).toString("hex")}`
}

function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`
}

// GET - Listar integrações do usuário
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const integrations = await sql`
      SELECT * FROM user_integrations 
      WHERE user_id = ${session.userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      integrations: integrations || [],
      limit: MAX_INTEGRATIONS,
      remaining: MAX_INTEGRATIONS - (integrations?.length || 0),
    })
  } catch (error) {
    console.error("Erro:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// POST - Criar nova integração
export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    // Verificar limite de integrações
    const existingIntegrations = await sql`
      SELECT id FROM user_integrations WHERE user_id = ${session.userId}
    `

    if ((existingIntegrations?.length || 0) >= MAX_INTEGRATIONS) {
      return NextResponse.json({ 
        error: `Limite de ${MAX_INTEGRATIONS} integracoes atingido` 
      }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, website_url } = body

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: "Nome deve ter pelo menos 3 caracteres" }, { status: 400 })
    }

    // Gerar credenciais
    const client_id = generateClientId()
    const client_secret = generateClientSecret()
    const webhook_secret = generateWebhookSecret()

    const integrations = await sql`
      INSERT INTO user_integrations (user_id, name, description, website_url, client_id, client_secret, webhook_secret, is_active)
      VALUES (${session.userId}, ${name.trim()}, ${description?.trim() || null}, ${website_url?.trim() || null}, ${client_id}, ${client_secret}, ${webhook_secret}, true)
      RETURNING *
    `
    const integration = integrations[0]

    return NextResponse.json({
      success: true,
      integration,
      message: "Integracao criada com sucesso",
    })
  } catch (error) {
    console.error("Erro:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// PUT - Atualizar integração
export async function PUT(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, website_url, webhook_url, is_active, regenerate_secret } = body

    if (!id) {
      return NextResponse.json({ error: "ID da integracao e obrigatorio" }, { status: 400 })
    }

    // Verificar se a integração pertence ao usuário
    const existing = await sql`
      SELECT id FROM user_integrations WHERE id = ${id} AND user_id = ${session.userId}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Integracao nao encontrada" }, { status: 404 })
    }

    // Construir query de update dinamicamente
    const updates: string[] = []
    const values: unknown[] = []
    
    if (name !== undefined) {
      updates.push(`name = $${values.length + 1}`)
      values.push(name.trim())
    }
    if (description !== undefined) {
      updates.push(`description = $${values.length + 1}`)
      values.push(description?.trim() || null)
    }
    if (website_url !== undefined) {
      updates.push(`website_url = $${values.length + 1}`)
      values.push(website_url?.trim() || null)
    }
    if (webhook_url !== undefined) {
      updates.push(`webhook_url = $${values.length + 1}`)
      values.push(webhook_url?.trim() || null)
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${values.length + 1}`)
      values.push(is_active)
    }
    if (regenerate_secret === "client") {
      updates.push(`client_secret = $${values.length + 1}`)
      values.push(generateClientSecret())
    }
    if (regenerate_secret === "webhook") {
      updates.push(`webhook_secret = $${values.length + 1}`)
      values.push(generateWebhookSecret())
    }

    updates.push(`updated_at = NOW()`)

    const integrations = await sql`
      UPDATE user_integrations 
      SET name = ${name?.trim() || existing[0].name},
          description = ${description?.trim() || null},
          website_url = ${website_url?.trim() || null},
          webhook_url = ${webhook_url?.trim() || null},
          is_active = ${is_active ?? true},
          client_secret = ${regenerate_secret === "client" ? generateClientSecret() : null}::text,
          webhook_secret = ${regenerate_secret === "webhook" ? generateWebhookSecret() : null}::text,
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      integration: integrations[0],
      message: "Integracao atualizada com sucesso",
    })
  } catch (error) {
    console.error("Erro:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// DELETE - Excluir integração
export async function DELETE(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID da integracao e obrigatorio" }, { status: 400 })
    }

    // Verificar se a integração pertence ao usuário
    const existing = await sql`
      SELECT id FROM user_integrations WHERE id = ${id} AND user_id = ${session.userId}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: "Integracao nao encontrada" }, { status: 404 })
    }

    await sql`DELETE FROM user_integrations WHERE id = ${id}`

    return NextResponse.json({
      success: true,
      message: "Integracao excluida com sucesso",
    })
  } catch (error) {
    console.error("Erro:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
