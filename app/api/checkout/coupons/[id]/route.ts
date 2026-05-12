import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const coupon = await sql`
      UPDATE checkout_coupons
      SET 
        code = COALESCE(${body.code?.toUpperCase()}, code),
        description = ${body.description},
        discount_type = COALESCE(${body.discount_type}, discount_type),
        discount_value = COALESCE(${body.discount_value}, discount_value),
        min_purchase = COALESCE(${body.min_purchase}, min_purchase),
        max_uses = ${body.max_uses},
        valid_until = ${body.valid_until},
        status = COALESCE(${body.status}, status),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `;

    if (coupon.length === 0) {
      return NextResponse.json({ error: "Cupom nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({ coupon: coupon[0] });
  } catch (error) {
    console.error("[API] Error updating coupon:", error);
    return NextResponse.json({ error: "Erro ao atualizar cupom" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;

    await sql`
      DELETE FROM checkout_coupons
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting coupon:", error);
    return NextResponse.json({ error: "Erro ao excluir cupom" }, { status: 500 });
  }
}
