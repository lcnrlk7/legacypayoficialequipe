import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

// API para testar se as credenciais estao funcionando
export async function GET(request: NextRequest) {
  try {
    // Extrair credenciais do header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return NextResponse.json(
        { 
          success: false,
          error: "Credenciais nao fornecidas", 
          code: "UNAUTHORIZED",
          message: "Inclua o header Authorization com Basic Auth"
        },
        { status: 401 }
      )
    }

    // Decodificar Basic Auth
    const base64Credentials = authHeader.slice(6)
    let credentials: string
    try {
      credentials = Buffer.from(base64Credentials, "base64").toString("utf-8")
    } catch {
      return NextResponse.json(
        { 
          success: false,
          error: "Credenciais mal formatadas", 
          code: "INVALID_FORMAT",
          message: "O header Authorization deve estar em formato Base64"
        },
        { status: 401 }
      )
    }

    const [clientId, clientSecret] = credentials.split(":")

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { 
          success: false,
          error: "Credenciais incompletas", 
          code: "INVALID_CREDENTIALS",
          message: "Formato esperado: Base64(client_id:client_secret)"
        },
        { status: 401 }
      )
    }

    // Tentar buscar na nova tabela de integrações
    const integrations = await sql`
      SELECT ui.*, p.id as profile_id, p.name, p.email, p.api_enabled, p.kyc_status, 
             p.daily_limit, p.fee_percentage, p.balance, p.webhook_url as profile_webhook
      FROM user_integrations ui
      JOIN profiles p ON ui.user_id = p.id
      WHERE ui.client_id = ${clientId} AND ui.client_secret = ${clientSecret}
    `

    let user
    let integrationData = null

    if (integrations.length > 0) {
      const integration = integrations[0]
      user = {
        id: integration.profile_id,
        name: integration.name,
        email: integration.email,
        api_enabled: integration.api_enabled,
        kyc_status: integration.kyc_status,
        daily_limit: integration.daily_limit,
        fee_percentage: integration.fee_percentage,
        balance: integration.balance,
        webhook_url: integration.profile_webhook
      }
      integrationData = {
        id: integration.id,
        name: integration.name,
        website_url: integration.website_url,
        is_active: integration.is_active,
        webhook_url: integration.webhook_url,
      }
    } else {
      // Fallback: buscar na tabela profiles
      const profiles = await sql`
        SELECT id, name, email, api_enabled, kyc_status, daily_limit, fee_percentage, balance, webhook_url
        FROM profiles
        WHERE client_id = ${clientId} AND client_secret = ${clientSecret}
      `

      if (profiles.length === 0) {
        return NextResponse.json(
          { 
            success: false,
            error: "Credenciais invalidas", 
            code: "INVALID_CREDENTIALS",
            message: "client_id ou client_secret incorretos"
          },
          { status: 401 }
        )
      }
      user = profiles[0]
    }

    // Verificar status da conta
    const issues: string[] = []
    
    if (!user.api_enabled) {
      issues.push("API desabilitada para esta conta")
    }
    
    if (user.kyc_status !== "approved") {
      issues.push(`KYC ${user.kyc_status === "pending" ? "pendente de aprovacao" : "nao aprovado"}`)
    }

    if (integrationData && !integrationData.is_active) {
      issues.push("Esta integracao esta desativada")
    }

    const webhookUrl = integrationData?.webhook_url || user.webhook_url

    return NextResponse.json({
      success: true,
      message: "Credenciais validadas com sucesso!",
      data: {
        account: {
          name: user.name,
          email: user.email,
        },
        integration: integrationData ? {
          id: integrationData.id,
          name: integrationData.name,
          website: integrationData.website_url,
          active: integrationData.is_active,
        } : null,
        status: {
          api_enabled: user.api_enabled,
          kyc_status: user.kyc_status,
          ready_to_use: user.api_enabled && user.kyc_status === "approved" && (!integrationData || integrationData.is_active),
        },
        limits: {
          daily_limit: user.daily_limit || 50000,
          fee_percentage: user.fee_percentage || 2.5,
        },
        webhook: {
          configured: !!webhookUrl,
          url: webhookUrl ? webhookUrl.substring(0, 30) + "..." : null,
        },
        balance: user.balance || 0,
        issues: issues.length > 0 ? issues : null,
      },
    })
  } catch (error) {
    console.error("[v0] Test API error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Erro interno do servidor", 
        code: "INTERNAL_ERROR" 
      },
      { status: 500 }
    )
  }
}
