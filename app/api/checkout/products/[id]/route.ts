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

    const product = await sql`
      SELECT * FROM checkout_products
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    if (product.length === 0) {
      return NextResponse.json({ error: "Produto nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({ product: product[0] });
  } catch (error) {
    console.error("[API] Error fetching product:", error);
    return NextResponse.json({ error: "Erro ao buscar produto" }, { status: 500 });
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
    const {
      name,
      description,
      price,
      compare_price,
      image_url,
      sku,
      stock,
      is_digital,
      status,
    } = body;

    const product = await sql`
      UPDATE checkout_products
      SET 
        name = COALESCE(${name}, name),
        description = ${description},
        price = COALESCE(${price}, price),
        compare_price = ${compare_price},
        image_url = ${image_url},
        sku = ${sku},
        stock = COALESCE(${stock}, stock),
        is_digital = COALESCE(${is_digital}, is_digital),
        status = COALESCE(${status}, status),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `;

    if (product.length === 0) {
      return NextResponse.json({ error: "Produto nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({ product: product[0] });
  } catch (error) {
    console.error("[API] Error updating product:", error);
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
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
      DELETE FROM checkout_products
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting product:", error);
    return NextResponse.json({ error: "Erro ao excluir produto" }, { status: 500 });
  }
}
