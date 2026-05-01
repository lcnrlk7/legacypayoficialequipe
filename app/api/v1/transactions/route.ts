import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Funcao para extrair credenciais do request
function extractCredentials(request: NextRequest): { clientId: string | null; clientSecret: string | null; apiKey: string | null } {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const base64Credentials = authHeader.slice(6);
      const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
      const [clientId, clientSecret] = credentials.split(":");
      if (clientId && clientSecret) return { clientId, clientSecret, apiKey: null };
    } catch { /* ignorar */ }
  }
  
  const headerClientId = request.headers.get("x-client-id") || request.headers.get("client-id");
  const headerClientSecret = request.headers.get("x-client-secret") || request.headers.get("client-secret");
  if (headerClientId && headerClientSecret) return { clientId: headerClientId, clientSecret: headerClientSecret, apiKey: null };
  
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) return { clientId: null, clientSecret: null, apiKey };
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [clientId, clientSecret] = decoded.split(":");
      if (clientId && clientSecret) return { clientId, clientSecret, apiKey: null };
    } catch { /* ignorar */ }
  }
  
  return { clientId: null, clientSecret: null, apiKey: null };
}

export async function GET(request: NextRequest) {
  try {
    const { clientId, clientSecret, apiKey } = extractCredentials(request);
    
    let user = null;
    
    if (clientId && clientSecret) {
      const userResult = await sql`
        SELECT * FROM profiles
        WHERE ((client_id = ${clientId} AND client_secret = ${clientSecret})
           OR (api_key = ${clientId} AND client_secret = ${clientSecret}))
          AND is_active = true
      `;
      user = userResult[0];
    } else if (apiKey) {
      const userResult = await sql`
        SELECT * FROM profiles
        WHERE api_key = ${apiKey} AND is_active = true
      `;
      user = userResult[0];
    }

    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Build query with filters
    let transactions;
    
    if (type && status && startDate && endDate) {
      transactions = await sql`
        SELECT * FROM transactions
        WHERE user_id = ${user.id}
          AND type = ${type}
          AND status = ${status}
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (type && status) {
      transactions = await sql`
        SELECT * FROM transactions
        WHERE user_id = ${user.id}
          AND type = ${type}
          AND status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (type) {
      transactions = await sql`
        SELECT * FROM transactions
        WHERE user_id = ${user.id}
          AND type = ${type}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (status) {
      transactions = await sql`
        SELECT * FROM transactions
        WHERE user_id = ${user.id}
          AND status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      transactions = await sql`
        SELECT * FROM transactions
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        limit,
        offset,
        total: transactions.length
      }
    });
  } catch (error) {
    console.error("[v0] Error in transactions API:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
