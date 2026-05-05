import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { verifySession } from "@/lib/session";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { avatarUrl } = await request.json();

    if (!avatarUrl) {
      return NextResponse.json(
        { error: "URL do avatar e obrigatoria" },
        { status: 400 }
      );
    }

    // Atualizar avatar_url no perfil
    await sql`
      UPDATE profiles 
      SET avatar_url = ${avatarUrl}, updated_at = NOW()
      WHERE id = ${session.userId}
    `;

    return NextResponse.json({ success: true, avatar_url: avatarUrl });
  } catch (error) {
    console.error("Erro ao definir avatar padrao:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
