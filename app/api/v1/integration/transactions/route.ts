import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Funcao para extrair credenciais do request
function extractCredentials(request: NextRequest): { clientId: string | null; clientSecret: string | null } {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const base64Credentials = authHeader.slice(6);
      const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
      const [clientId, clientSecret] = credentials.split(":");
      if (clientId && clientSecret) return { clientId, clientSecret };
    } catch { /* ignorar */ }
  }
  
  const headerClientId = request.headers.get("x-client-id") || request.headers.get("client-id");
  const headerClientSecret = request.headers.get("x-client-secret") || request.headers.get("client-secret");
  if (headerClientId && headerClientSecret) return { clientId: headerClientId, clientSecret: headerClientSecret };
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [clientId, clientSecret] = decoded.split(":");
      if (clientId && clientSecret) return { clientId, clientSecret };
    } catch { /* ignorar */ }
  }
  
  return { clientId: null, clientSecret: null };
}

// GET - Listar transações da integração
export async function GET(request: NextRequest) {
  try {
    const { clientId, clientSecret } = extractCredentials(request);
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Credenciais não fornecidas", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Buscar integração pelas credenciais na tabela user_integrations
    const integrationResult = await sql`
      SELECT ui.user_id, ui.is_active as integration_active,
             p.is_active
      FROM user_integrations ui
      INNER JOIN profiles p ON p.id::text = ui.user_id::text
      WHERE ui.client_id = ${clientId} AND ui.client_secret = ${clientSecret}
    `;

    // Se nao encontrou em user_integrations, tentar na tabela profiles
    if (integrationResult.length === 0) {
      const profileResult = await sql`
        SELECT id as user_id, is_active, true as integration_active
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
    const userId = integration.user_id;

    if (!integration.integration_active) {
      return NextResponse.json(
        { success: false, error: "Esta integração está desativada", code: "INTEGRATION_DISABLED" },
        { status: 403 }
      );
    }

    if (!integration.is_active) {
      return NextResponse.json(
        { success: false, error: "Conta desativada", code: "ACCOUNT_DISABLED" },
        { status: 403 }
      );
    }

    // Parâmetros de busca
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Buscar transações
    let transactions;
    
    if (status) {
      transactions = await sql`
        SELECT id, external_id, amount, fee, net_amount, status, description, 
               payer_name, payer_document, created_at, updated_at
        FROM transactions 
        WHERE user_id::text = ${userId}::text 
          AND status = ${status}
          AND (${startDate}::timestamp IS NULL OR created_at >= ${startDate}::timestamp)
          AND (${endDate}::timestamp IS NULL OR created_at <= ${endDate}::timestamp)
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      transactions = await sql`
        SELECT id, external_id, amount, fee, net_amount, status, description, 
               payer_name, payer_document, created_at, updated_at
        FROM transactions 
        WHERE user_id::text = ${userId}::text
          AND (${startDate}::timestamp IS NULL OR created_at >= ${startDate}::timestamp)
          AND (${endDate}::timestamp IS NULL OR created_at <= ${endDate}::timestamp)
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Contar total
    const countResult = await sql`
      SELECT COUNT(*) as total FROM transactions WHERE user_id::text = ${userId}::text
    `;

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map((tx: {
          id: string;
          external_id: string;
          amount: number;
          fee: number;
          net_amount: number;
          status: string;
          description: string;
          payer_name: string;
          payer_document: string;
          created_at: string;
          updated_at: string;
        }) => ({
          transaction_id: tx.id,
          external_id: tx.external_id,
          amount: tx.amount,
          fee: tx.fee,
          net_amount: tx.net_amount,
          status: tx.status,
          description: tx.description,
          payer: {
            name: tx.payer_name,
            document: tx.payer_document,
          },
          created_at: tx.created_at,
          updated_at: tx.updated_at,
        })),
        pagination: {
          total: parseInt(countResult[0].total),
          limit,
          offset,
          has_more: offset + transactions.length < parseInt(countResult[0].total),
        },
      },
    });
  } catch (error) {
    console.error("[v1/integration/transactions] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
