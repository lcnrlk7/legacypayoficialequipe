import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      checkout_id,
      seller_id,
      customer,
      items,
      subtotal,
      discount,
      total,
      coupon_code,
      payment_method,
    } = body;

    if (!checkout_id || !seller_id || !customer || !items || items.length === 0) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Create the order
    const order = await sql`
      INSERT INTO checkout_orders (
        checkout_id, seller_id,
        customer_name, customer_email, customer_phone, customer_cpf,
        subtotal, discount, total,
        coupon_code, payment_method,
        payment_status, delivery_status, status
      ) VALUES (
        ${checkout_id}, ${seller_id},
        ${customer.name}, ${customer.email}, ${customer.phone || null}, ${customer.cpf || null},
        ${subtotal}, ${discount || 0}, ${total},
        ${coupon_code || null}, ${payment_method || 'pix'},
        'pending', 'pending', 'pending'
      )
      RETURNING *
    `;

    const orderId = order[0].id;

    // Create order items
    for (const item of items) {
      await sql`
        INSERT INTO checkout_order_items (
          order_id, product_id, product_name, product_price, quantity, total
        ) VALUES (
          ${orderId}, ${item.product_id}, ${item.product_name},
          ${item.product_price}, ${item.quantity},
          ${item.product_price * item.quantity}
        )
      `;
    }

    // Update coupon usage if used
    if (coupon_code) {
      await sql`
        UPDATE checkout_coupons
        SET uses_count = uses_count + 1
        WHERE code = ${coupon_code}
      `;
    }

    return NextResponse.json({ 
      success: true, 
      order_id: orderId,
      order: order[0]
    });
  } catch (error) {
    console.error("[API] Error creating order:", error);
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}
