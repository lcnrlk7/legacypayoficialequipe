import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const coupons = await sql`
      SELECT * FROM checkout_coupons
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("[API] Error fetching coupons:", error);
    return NextResponse.json({ error: "Erro ao buscar cupons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_purchase,
      max_uses,
      valid_until,
    } = body;

    if (!code || discount_value === undefined) {
      return NextResponse.json({ error: "Codigo e valor sao obrigatorios" }, { status: 400 });
    }

    const coupon = await sql`
      INSERT INTO checkout_coupons (
        user_id, code, description, discount_type, discount_value,
        min_purchase, max_uses, valid_until, status
      ) VALUES (
        ${user.id}, ${code.toUpperCase()}, ${description}, ${discount_type || 'percentage'},
        ${discount_value}, ${min_purchase || 0}, ${max_uses}, ${valid_until}, 'active'
      )
      RETURNING *
    `;

    return NextResponse.json({ coupon: coupon[0] });
  } catch (error) {
    console.error("[API] Error creating coupon:", error);
    return NextResponse.json({ error: "Erro ao criar cupom" }, { status: 500 });
  }
}
