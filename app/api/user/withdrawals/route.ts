import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");

    let withdrawals;

    if (status) {
      withdrawals = await sql`
        SELECT * FROM withdrawals 
        WHERE user_id = ${user.id} AND status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      withdrawals = await sql`
        SELECT * FROM withdrawals 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    return NextResponse.json({ withdrawals: withdrawals || [] });
  } catch (error) {
    console.error("[v0] Error fetching user withdrawals:", error);
    return NextResponse.json(
      { error: "Erro ao buscar saques" },
      { status: 500 }
    );
  }
}
