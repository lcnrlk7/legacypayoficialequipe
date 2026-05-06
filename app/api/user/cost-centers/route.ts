import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

// GET - Listar centros de custo do usuario
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const costCenters = await sql`
      SELECT * FROM cost_centers
      WHERE user_id = ${session.userId}
      ORDER BY name ASC
    `;

    return NextResponse.json({ costCenters });
  } catch (error) {
    console.error("[API] Erro ao listar centros de custo:", error);
    return NextResponse.json({ error: "Erro ao listar centros de custo" }, { status: 500 });
  }
}

// POST - Criar centro de custo
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Nome e obrigatorio" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO cost_centers (user_id, name, description, color)
      VALUES (${session.userId}, ${name.trim()}, ${description || null}, ${color || "#10B981"})
      RETURNING *
    `;

    return NextResponse.json({ costCenter: result[0] });
  } catch (error) {
    console.error("[API] Erro ao criar centro de custo:", error);
    return NextResponse.json({ error: "Erro ao criar centro de custo" }, { status: 500 });
  }
}

// PUT - Atualizar centro de custo
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, color, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID e obrigatorio" }, { status: 400 });
    }

    const result = await sql`
      UPDATE cost_centers
      SET 
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        color = COALESCE(${color}, color),
        is_active = COALESCE(${is_active}, is_active)
      WHERE id = ${id} AND user_id = ${session.userId}
      RETURNING *
    `;

    return NextResponse.json({ costCenter: result[0] });
  } catch (error) {
    console.error("[API] Erro ao atualizar centro de custo:", error);
    return NextResponse.json({ error: "Erro ao atualizar centro de custo" }, { status: 500 });
  }
}

// DELETE - Deletar centro de custo
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
      DELETE FROM cost_centers
      WHERE id = ${id} AND user_id = ${session.userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Erro ao deletar centro de custo:", error);
    return NextResponse.json({ error: "Erro ao deletar centro de custo" }, { status: 500 });
  }
}
