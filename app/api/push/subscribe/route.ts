import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { subscription } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Subscription invalida" },
        { status: 400 }
      )
    }

    // Verificar se já existe essa subscription
    const existing = await sql`
      SELECT id FROM push_subscriptions 
      WHERE user_id = ${session.userId} AND endpoint = ${subscription.endpoint}
    `

    if (existing.length > 0) {
      // Atualizar subscription existente
      await sql`
        UPDATE push_subscriptions 
        SET p256dh = ${subscription.keys.p256dh},
            auth = ${subscription.keys.auth},
            user_agent = ${request.headers.get("user-agent") || null}
        WHERE id = ${existing[0].id}
      `

      return NextResponse.json({ success: true, message: "Subscription atualizada" })
    }

    // Criar nova subscription
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
      VALUES (${session.userId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth}, ${request.headers.get("user-agent") || null})
    `

    return NextResponse.json({ success: true, message: "Subscription registrada" })
  } catch (error) {
    console.error("[v0] Push subscribe error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint obrigatorio" },
        { status: 400 }
      )
    }

    await sql`
      DELETE FROM push_subscriptions 
      WHERE user_id = ${session.userId} AND endpoint = ${endpoint}
    `

    return NextResponse.json({ success: true, message: "Subscription removida" })
  } catch (error) {
    console.error("[v0] Push unsubscribe error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
