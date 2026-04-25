import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { webhookUrl } = await request.json();

    await sql`
      UPDATE profiles 
      SET webhook_url = ${webhookUrl}
      WHERE id = ${session.userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error updating webhook:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar webhook" },
      { status: 500 }
    );
  }
}
