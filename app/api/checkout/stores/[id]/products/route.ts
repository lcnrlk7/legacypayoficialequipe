import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const checkout = await sql`
      SELECT id FROM checkouts WHERE id = ${id} AND user_id = ${user.id}
    `;
    if (checkout.length === 0) {
      return NextResponse.json({ error: "Checkout nao encontrado" }, { status: 404 });
    }

    // Get products in this checkout
    const products = await sql`
      SELECT 
        cpi.product_id,
        cpi.custom_price,
        cpi.sort_order,
        p.id,
        p.name,
        p.price,
        p.image_url
      FROM checkout_product_items cpi
      JOIN checkout_products p ON cpi.product_id = p.id
      WHERE cpi.checkout_id = ${id}
      ORDER BY cpi.sort_order ASC
    `;

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[API] Error fetching checkout products:", error);
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
  }
}

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
    const { products } = body;

    // Verify ownership
    const checkout = await sql`
      SELECT id FROM checkouts WHERE id = ${id} AND user_id = ${user.id}
    `;
    if (checkout.length === 0) {
      return NextResponse.json({ error: "Checkout nao encontrado" }, { status: 404 });
    }

    // Delete existing products
    await sql`DELETE FROM checkout_product_items WHERE checkout_id = ${id}`;

    // Add new products
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      await sql`
        INSERT INTO checkout_product_items (checkout_id, product_id, custom_price, sort_order)
        VALUES (${id}, ${product.product_id}, ${product.custom_price}, ${i})
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error updating checkout products:", error);
    return NextResponse.json({ error: "Erro ao atualizar produtos" }, { status: 500 });
  }
}
