import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Buscar ultima transacao do usuario
    const transactions = await sql`
      SELECT id, amount, type, status, description, created_at
      FROM transactions
      WHERE user_id = ${session.userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (transactions.length === 0) {
      return NextResponse.json({ transaction: null });
    }

    return NextResponse.json({ transaction: transactions[0] });
  } catch (error) {
    console.error("[API] Erro ao buscar ultima transacao:", error);
    return NextResponse.json(
      { error: "Erro ao buscar transacao" },
      { status: 500 }
    );
  }
}
