import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { sql } from "@/lib/db";

// GET - Listar tags do usuario
export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const tags = await sql`
      SELECT * FROM transaction_tags
      WHERE user_id = ${session.userId}
      ORDER BY name ASC
    `;

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("[API] Erro ao listar tags:", error);
    return NextResponse.json({ error: "Erro ao listar tags" }, { status: 500 });
  }
}

// POST - Criar tag
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Nome e obrigatorio" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO transaction_tags (user_id, name, color)
      VALUES (${session.userId}, ${name.trim()}, ${color || "#3B82F6"})
      RETURNING *
    `;

    return NextResponse.json({ tag: result[0] });
  } catch (error) {
    console.error("[API] Erro ao criar tag:", error);
    return NextResponse.json({ error: "Erro ao criar tag" }, { status: 500 });
  }
}

// DELETE - Deletar tag
export async function DELETE(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID e obrigatorio" }, { status: 400 });
    }

    // Deletar relacoes primeiro
    await sql`DELETE FROM transaction_tag_relations WHERE tag_id = ${id}`;
    
    // Deletar tag
    await sql`
      DELETE FROM transaction_tags
      WHERE id = ${id} AND user_id = ${session.userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Erro ao deletar tag:", error);
    return NextResponse.json({ error: "Erro ao deletar tag" }, { status: 500 });
  }
}
