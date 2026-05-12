import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const orders = await sql`
      SELECT 
        o.*,
        c.name as checkout_name
      FROM checkout_orders o
      LEFT JOIN checkouts c ON o.checkout_id = c.id
      WHERE o.seller_id = ${user.id}
      ORDER BY o.created_at DESC
    `;

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[API] Error fetching orders:", error);
    return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 });
  }
}
