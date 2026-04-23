import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key não fornecida" },
        { status: 401 }
      );
    }

    const result = await sql`
      SELECT balance FROM profiles
      WHERE api_key = ${apiKey} AND is_active = true
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "API key inválida" },
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
