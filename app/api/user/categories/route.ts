import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

// GET - Listar categorias do usuario
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const categories = await sql`
      SELECT * FROM transaction_categories
      WHERE user_id = ${session.userId}
      ORDER BY name ASC
    `;

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[API] Erro ao listar categorias:", error);
    return NextResponse.json({ error: "Erro ao listar categorias" }, { status: 500 });
  }
}

// POST - Criar categoria
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, icon } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Nome e obrigatorio" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO transaction_categories (user_id, name, color, icon)
      VALUES (${session.userId}, ${name.trim()}, ${color || "#FF6B00"}, ${icon || "tag"})
      RETURNING *
    `;

    return NextResponse.json({ category: result[0] });
  } catch (error) {
    console.error("[API] Erro ao criar categoria:", error);
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}

// DELETE - Deletar categoria
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID e obrigatorio" }, { status: 400 });
    }

    await sql`
      DELETE FROM transaction_categories
      WHERE id = ${id} AND user_id = ${session.userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Erro ao deletar categoria:", error);
    return NextResponse.json({ error: "Erro ao deletar categoria" }, { status: 500 });
  }
}
