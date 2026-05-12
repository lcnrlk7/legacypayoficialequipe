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
    
    // Suportar ambos formatos: {subscription: {...}} ou {endpoint, p256dh, auth}
    let endpoint: string
    let p256dh: string
    let auth: string
    
    if (body.subscription) {
      endpoint = body.subscription.endpoint
      p256dh = body.subscription.keys?.p256dh
      auth = body.subscription.keys?.auth
    } else {
      endpoint = body.endpoint
      p256dh = body.p256dh
      auth = body.auth
    }

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: "Subscription invalida - endpoint, p256dh e auth sao obrigatorios" },
        { status: 400 }
      )
    }

    // Verificar se ja existe essa subscription
    const existing = await sql`
      SELECT id FROM push_subscriptions 
      WHERE user_id = ${session.userId} AND endpoint = ${endpoint}
    `

    if (existing.length > 0) {
      // Atualizar subscription existente
      await sql`
        UPDATE push_subscriptions 
        SET p256dh = ${p256dh},
            auth = ${auth},
            user_agent = ${request.headers.get("user-agent") || null}
        WHERE id = ${existing[0].id}
      `

      return NextResponse.json({ success: true, message: "Subscription atualizada" })
    }

    // Criar nova subscription
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
      VALUES (${session.userId}, ${endpoint}, ${p256dh}, ${auth}, ${request.headers.get("user-agent") || null})
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
