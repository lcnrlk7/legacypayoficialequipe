import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { NextResponse, NextRequest } from "next/server"
import crypto from "crypto"

// Testar webhook de uma integracao
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { integration_id } = body

    let webhookUrl: string
    let webhookSecret: string

    if (integration_id) {
      // Buscar da integracao especifica (tabela user_integrations)
      const integrations = await sql`
        SELECT webhook_url, webhook_secret FROM user_integrations 
        WHERE id = ${integration_id} AND user_id = ${session.userId}
      `
      const integration = integrations[0]

      if (!integration) {
        return NextResponse.json({ error: "Integracao nao encontrada" }, { status: 404 })
      }

      if (!integration.webhook_url) {
        return NextResponse.json(
          { success: false, message: "Webhook URL nao configurada para esta integracao" },
          { status: 400 }
        )
      }

      webhookUrl = integration.webhook_url
      webhookSecret = integration.webhook_secret
    } else {
      // Fallback: buscar do profile
      const profiles = await sql`
        SELECT webhook_url, webhook_secret FROM profiles WHERE id = ${session.userId}
      `
      const profile = profiles[0]

      if (!profile?.webhook_url) {
        return NextResponse.json(
          { success: false, message: "Webhook URL nao configurada" },
          { status: 400 }
        )
      }

      webhookUrl = profile.webhook_url
      webhookSecret = profile.webhook_secret
    }

    // Criar payload de teste
    const testPayload = {
      event: "payment.test",
      timestamp: new Date().toISOString(),
      data: {
        id: "test_" + crypto.randomBytes(8).toString("hex"),
        external_id: "test_payment",
        amount: 100.00,
        fee: 2.50,
        net_amount: 97.50,
        status: "completed",
        payer_name: "Teste Hyperion Pay",
        payer_document: "12345678900",
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    }

    // Gerar assinatura
    const signature = crypto
      .createHmac("sha256", webhookSecret || "")
      .update(JSON.stringify(testPayload))
      .digest("hex")

    // Enviar para o webhook
    const startTime = Date.now()
    let webhookResponse
    let webhookError = null
    let responseTime = 0
    let responseStatus = 0
    let responseBody = ""

    try {
      webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hyperion Pay-Signature": signature,
          "X-Hyperion Pay-Event": "payment.test",
          "X-Hyperion Pay-Timestamp": testPayload.timestamp,
        },
        body: JSON.stringify(testPayload),
      })

      responseTime = Date.now() - startTime
      responseStatus = webhookResponse.status
      
      try {
        responseBody = await webhookResponse.text()
        if (responseBody.length > 500) {
          responseBody = responseBody.substring(0, 500) + "..."
        }
      } catch {
        responseBody = "[Nao foi possivel ler a resposta]"
      }
    } catch (error) {
      responseTime = Date.now() - startTime
      webhookError = error instanceof Error ? error.message : "Erro desconhecido"
    }

    const success = responseStatus >= 200 && responseStatus < 300

    return NextResponse.json({
      success,
      message: success 
        ? "Webhook recebeu a requisicao com sucesso!" 
        : webhookError ? `Erro: ${webhookError}` : `Webhook retornou status ${responseStatus}`,
      data: {
        webhook_url: webhookUrl,
        response_time_ms: responseTime,
        response_status: responseStatus || null,
        response_body: responseBody || null,
        error: webhookError,
        test_payload: testPayload,
        signature_header: "X-Hyperion Pay-Signature",
      },
    })
  } catch (error) {
    console.error("[v0] Error testing webhook:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
