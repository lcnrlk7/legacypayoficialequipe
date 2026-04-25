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

    const userResult = await sql`
      SELECT * FROM profiles
      WHERE api_key = ${apiKey} AND is_active = true
    `;

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: "API key inválida" },
        { status: 401 }
      );
    }

    const user = userResult[0];
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
