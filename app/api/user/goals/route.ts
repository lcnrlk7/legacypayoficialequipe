import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

// GET - Listar metas do usuario
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const goals = await sql`
      SELECT 
        g.*,
        tc.name as category_name,
        tc.color as category_color,
        COALESCE(
          (SELECT SUM(t.amount) 
           FROM transactions t 
           WHERE t.user_id = g.user_id 
             AND t.type = 'payment' 
             AND t.status = 'completed'
             AND t.created_at >= g.start_date 
             AND t.created_at <= g.end_date
             AND (g.category_id IS NULL OR t.category_id = g.category_id)
          ), 0
        ) as current_amount
      FROM goals g
      LEFT JOIN transaction_categories tc ON g.category_id = tc.id
      WHERE g.user_id = ${session.userId}
      ORDER BY g.end_date ASC
    `;

    return NextResponse.json({ goals });
  } catch (error) {
    console.error("[API] Erro ao listar metas:", error);
    return NextResponse.json({ error: "Erro ao listar metas" }, { status: 500 });
  }
}

// POST - Criar meta
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, target_amount, category_id, period, start_date, end_date } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Nome e obrigatorio" }, { status: 400 });
    }

    if (!target_amount || target_amount <= 0) {
      return NextResponse.json({ error: "Valor da meta e obrigatorio" }, { status: 400 });
    }

    // Calcular datas baseado no periodo se nao fornecidas
    let startDateValue = start_date;
    let endDateValue = end_date;

    if (!startDateValue || !endDateValue) {
      const now = new Date();
      startDateValue = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      
      if (period === "weekly") {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        endDateValue = nextWeek.toISOString().split("T")[0];
      } else if (period === "yearly") {
        endDateValue = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0];
      } else {
        // monthly (default)
        endDateValue = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      }
    }

    const result = await sql`
      INSERT INTO goals (user_id, name, target_amount, category_id, period, start_date, end_date)
      VALUES (
        ${session.userId}, 
        ${name.trim()}, 
        ${target_amount}, 
        ${category_id || null}, 
        ${period || "monthly"},
        ${startDateValue},
        ${endDateValue}
      )
      RETURNING *
    `;

    return NextResponse.json({ goal: result[0] });
  } catch (error) {
    console.error("[API] Erro ao criar meta:", error);
    return NextResponse.json({ error: "Erro ao criar meta" }, { status: 500 });
  }
}

// PUT - Atualizar meta
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, target_amount, category_id, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID e obrigatorio" }, { status: 400 });
    }

    const result = await sql`
      UPDATE goals
      SET 
        name = COALESCE(${name}, name),
        target_amount = COALESCE(${target_amount}, target_amount),
        category_id = ${category_id},
        is_active = COALESCE(${is_active}, is_active)
      WHERE id = ${id} AND user_id = ${session.userId}
      RETURNING *
    `;

    return NextResponse.json({ goal: result[0] });
  } catch (error) {
    console.error("[API] Erro ao atualizar meta:", error);
    return NextResponse.json({ error: "Erro ao atualizar meta" }, { status: 500 });
  }
}

// DELETE - Deletar meta
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
      DELETE FROM goals
      WHERE id = ${id} AND user_id = ${session.userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Erro ao deletar meta:", error);
    return NextResponse.json({ error: "Erro ao deletar meta" }, { status: 500 });
  }
}
