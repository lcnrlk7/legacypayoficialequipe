import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET - Listar historico de logins
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const history = await sql`
      SELECT 
        id,
        ip_address,
        user_agent,
        device_type,
        browser,
        location,
        success,
        created_at
      FROM login_history
      WHERE user_id = ${session.userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Erro ao buscar historico:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
