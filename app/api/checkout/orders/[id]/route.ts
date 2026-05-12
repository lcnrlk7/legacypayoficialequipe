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

    const updates: string[] = [];
    
    if (body.payment_status) {
      if (body.payment_status === 'paid') {
        // Also set paid_at timestamp
        const order = await sql`
          UPDATE checkout_orders
          SET 
            payment_status = ${body.payment_status},
            paid_at = NOW(),
            updated_at = NOW()
          WHERE id = ${id} AND seller_id = ${user.id}
          RETURNING *
        `;
        return NextResponse.json({ order: order[0] });
      }
    }
    
    if (body.delivery_status) {
      if (body.delivery_status === 'delivered') {
        const order = await sql`
          UPDATE checkout_orders
          SET 
            delivery_status = ${body.delivery_status},
            delivered_at = NOW(),
            status = 'delivered',
            updated_at = NOW()
          WHERE id = ${id} AND seller_id = ${user.id}
          RETURNING *
        `;
        return NextResponse.json({ order: order[0] });
      } else {
        const order = await sql`
          UPDATE checkout_orders
          SET 
            delivery_status = ${body.delivery_status},
            status = ${body.delivery_status === 'sent' ? 'shipped' : 'confirmed'},
            updated_at = NOW()
          WHERE id = ${id} AND seller_id = ${user.id}
          RETURNING *
        `;
        return NextResponse.json({ order: order[0] });
      }
    }

    const order = await sql`
      UPDATE checkout_orders
      SET 
        payment_status = COALESCE(${body.payment_status}, payment_status),
        delivery_status = COALESCE(${body.delivery_status}, delivery_status),
        status = COALESCE(${body.status}, status),
        notes = COALESCE(${body.notes}, notes),
        updated_at = NOW()
      WHERE id = ${id} AND seller_id = ${user.id}
      RETURNING *
    `;

    if (order.length === 0) {
      return NextResponse.json({ error: "Pedido nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({ order: order[0] });
  } catch (error) {
    console.error("[API] Error updating order:", error);
    return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 });
  }
}
