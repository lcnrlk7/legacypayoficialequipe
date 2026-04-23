import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function DELETE() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Nao autenticado" },
        { status: 401 }
      );
    }

    // Deletar dados relacionados
    await sql`DELETE FROM transactions WHERE user_id = ${user.id}`;
    await sql`DELETE FROM withdrawals WHERE user_id = ${user.id}`;
    await sql`DELETE FROM pix_keys WHERE user_id = ${user.id}`;
    await sql`DELETE FROM kyc_documents WHERE user_id = ${user.id}`;
    await sql`DELETE FROM user_notifications WHERE user_id = ${user.id}`;
    await sql`DELETE FROM audit_logs WHERE user_id = ${user.id}`;
    
    // Deletar usuario
    await sql`DELETE FROM profiles WHERE id = ${user.id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DeleteUser] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
