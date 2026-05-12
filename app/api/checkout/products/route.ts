import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const products = await sql`
      SELECT * FROM checkout_products
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[API] Error fetching products:", error);
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
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
      name,
      description,
      price,
      compare_price,
      image_url,
      sku,
      stock,
      is_digital,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Nome e preco sao obrigatorios" }, { status: 400 });
    }

    const product = await sql`
      INSERT INTO checkout_products (
        user_id, name, description, price, compare_price,
        image_url, sku, stock, is_digital, status
      ) VALUES (
        ${user.id}, ${name}, ${description}, ${price}, ${compare_price},
        ${image_url}, ${sku}, ${stock ?? -1}, ${is_digital ?? false}, 'active'
      )
      RETURNING *
    `;

    return NextResponse.json({ product: product[0] });
  } catch (error) {
    console.error("[API] Error creating product:", error);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}
