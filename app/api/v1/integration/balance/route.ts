import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET - Consultar saldo da conta
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return NextResponse.json(
        { success: false, error: "Credenciais não fornecidas", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const base64Credentials = authHeader.slice(6);
    let credentials: string;
    try {
      credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    } catch {
      return NextResponse.json(
        { success: false, error: "Credenciais mal formatadas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }
    const [clientId, clientSecret] = credentials.split(":");

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    // Buscar integração pelas credenciais na tabela user_integrations
    const integrationResult = await sql`
      SELECT ui.user_id, ui.is_active as integration_active,
             p.id as profile_id, p.balance, p.kyc_status, p.is_active
      FROM user_integrations ui
      INNER JOIN profiles p ON p.id = ui.user_id
      WHERE ui.client_id = ${clientId} AND ui.client_secret = ${clientSecret}
    `;

    // Se nao encontrou em user_integrations, tentar na tabela profiles
    if (integrationResult.length === 0) {
      const profileResult = await sql`
        SELECT id as user_id, id as profile_id, balance, kyc_status, is_active, true as integration_active
        FROM profiles
        WHERE (client_id = ${clientId} AND client_secret = ${clientSecret})
           OR (api_key = ${clientId} AND client_secret = ${clientSecret})
      `;
      
      if (profileResult.length === 0) {
        return NextResponse.json(
          { success: false, error: "Credenciais inválidas", code: "INVALID_CREDENTIALS" },
          { status: 401 }
        );
      }
      
      // Usar resultado do profiles
      integrationResult.push(profileResult[0]);
    }

    const integration = integrationResult[0];
    const profile = {
      id: integration.user_id,
      balance: integration.balance,
      kyc_status: integration.kyc_status,
      is_active: integration.is_active
    };

    if (!integration.integration_active) {
      return NextResponse.json(
        { success: false, error: "Esta integração está desativada", code: "INTEGRATION_DISABLED" },
        { status: 403 }
      );
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { success: false, error: "Conta desativada", code: "ACCOUNT_DISABLED" },
        { status: 403 }
      );
    }

    // Buscar estatísticas
    const statsResult = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_received,
        COALESCE(SUM(fee) FILTER (WHERE status = 'completed'), 0) as total_fees
      FROM transactions 
      WHERE user_id = ${profile.id} AND type = 'pix_in'
    `;

    const stats = statsResult[0];

    return NextResponse.json({
      success: true,
      data: {
        balance: Number(profile.balance) || 0,
        kyc_status: profile.kyc_status,
        statistics: {
          completed_transactions: parseInt(stats.completed_count) || 0,
          pending_transactions: parseInt(stats.pending_count) || 0,
          total_received: Number(stats.total_received) || 0,
          total_fees: Number(stats.total_fees) || 0,
        },
      },
    });
  } catch (error) {
    console.error("[v1/integration/balance] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
