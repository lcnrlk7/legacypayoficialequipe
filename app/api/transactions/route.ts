import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const isAdmin = user.role === "admin" || user.role === "ceo" || user.role === "manager";

    let transactions;

    if (isAdmin) {
      // Admin vê todas as transações
      transactions = await sql`
        SELECT t.*, p.email as user_email, p.name as user_name
        FROM transactions t
        LEFT JOIN profiles p ON t.user_id = p.id
        ORDER BY t.created_at DESC
        LIMIT 500
      `;
    } else {
      // Usuário comum vê apenas suas transações
      transactions = await sql`
        SELECT * FROM transactions
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 100
      `;
    }

    return NextResponse.json({ transactions: transactions || [] });
  } catch (error) {
    console.error("[v0] Error in transactions API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
