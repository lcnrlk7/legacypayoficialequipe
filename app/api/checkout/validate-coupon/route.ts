import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, checkout_id, subtotal } = body;

    if (!code) {
      return NextResponse.json({ error: "Codigo obrigatorio" }, { status: 400 });
    }

    // Get checkout owner
    const checkout = await sql`
      SELECT user_id FROM checkouts WHERE id = ${checkout_id}
    `;

    if (checkout.length === 0) {
      return NextResponse.json({ error: "Checkout nao encontrado" }, { status: 404 });
    }

    // Find valid coupon from this user
    const coupons = await sql`
      SELECT * FROM checkout_coupons
      WHERE code = ${code.toUpperCase()}
      AND user_id = ${checkout[0].user_id}
      AND status = 'active'
      AND (valid_until IS NULL OR valid_until > NOW())
      AND (max_uses IS NULL OR uses_count < max_uses)
      AND min_purchase <= ${subtotal || 0}
    `;

    if (coupons.length === 0) {
      return NextResponse.json({ error: "Cupom invalido ou expirado" }, { status: 400 });
    }

    const coupon = coupons[0];

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = (subtotal * coupon.discount_value) / 100;
    } else {
      discount = coupon.discount_value;
    }

    // Don't allow discount greater than subtotal
    discount = Math.min(discount, subtotal);

    return NextResponse.json({
      valid: true,
      coupon_id: coupon.id,
      discount,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
    });
  } catch (error) {
    console.error("[API] Error validating coupon:", error);
    return NextResponse.json({ error: "Erro ao validar cupom" }, { status: 500 });
  }
}
