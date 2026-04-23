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
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    const [clientId, clientSecret] = credentials.split(":");

    // Buscar usuário pelas credenciais de integração
    const profileResult = await sql`
      SELECT id, balance, kyc_status, api_enabled, is_active
      FROM profiles
      WHERE client_id = ${clientId} AND client_secret = ${clientSecret}
    `;

    if (profileResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const profile = profileResult[0];

    if (!profile.is_active || !profile.api_enabled) {
      return NextResponse.json(
        { success: false, error: "Integração desativada", code: "INTEGRATION_DISABLED" },
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
