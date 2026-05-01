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
    
    let result;
    
    if (clientId && clientSecret) {
      result = await sql`
        SELECT balance FROM profiles
        WHERE ((client_id = ${clientId} AND client_secret = ${clientSecret})
           OR (api_key = ${clientId} AND client_secret = ${clientSecret}))
          AND is_active = true
      `;
    } else if (apiKey) {
      result = await sql`
        SELECT balance FROM profiles
        WHERE api_key = ${apiKey} AND is_active = true
      `;
    } else {
      return NextResponse.json(
        { error: "Credenciais não fornecidas" },
        { status: 401 }
      );
    }

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: Number(result[0].balance),
        currency: "BRL"
      }
    });
  } catch (error) {
    console.error("[v0] Error in balance API:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
