import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";


// DELETE - Desvincular usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ceo") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;

    await sql`DELETE FROM telegram_users WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao desvincular usuario:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
