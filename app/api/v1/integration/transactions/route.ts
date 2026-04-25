import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET - Listar transações da integração
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

    // Buscar usuário pelas credenciais
    const profileResult = await sql`
      SELECT id, api_enabled, is_active
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
        WHERE user_id = ${profile.id} 
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
        WHERE user_id = ${profile.id}
          AND (${startDate}::timestamp IS NULL OR created_at >= ${startDate}::timestamp)
          AND (${endDate}::timestamp IS NULL OR created_at <= ${endDate}::timestamp)
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Contar total
    const countResult = await sql`
      SELECT COUNT(*) as total FROM transactions WHERE user_id = ${profile.id}
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
