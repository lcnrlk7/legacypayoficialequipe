import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Buscar pedido
    const orderResult = await sql`
      SELECT 
        id, 
        payment_status, 
        status,
        pix_transaction_id,
        created_at
      FROM checkout_orders 
      WHERE id = ${orderId}
    `;

    if (orderResult.length === 0) {
      return NextResponse.json({ error: "Pedido nao encontrado" }, { status: 404 });
    }

    const order = orderResult[0];

    // Se tem transacao vinculada, verificar status dela tambem
    let transactionStatus = null;
    if (order.pix_transaction_id) {
      const txResult = await sql`
        SELECT status FROM transactions WHERE id = ${order.pix_transaction_id}
      `;
      if (txResult.length > 0) {
        transactionStatus = txResult[0].status;
      }
    }

    // Determinar se o pagamento foi confirmado
    const isPaid = 
      order.payment_status === 'paid' || 
      order.payment_status === 'completed' ||
      order.status === 'paid' ||
      order.status === 'completed' ||
      transactionStatus === 'completed' ||
      transactionStatus === 'paid';

    return NextResponse.json({
      success: true,
      order_id: order.id,
      payment_status: order.payment_status,
      status: order.status,
      transaction_status: transactionStatus,
      is_paid: isPaid,
      created_at: order.created_at,
    });
  } catch (error) {
    console.error("[API] Error checking order status:", error);
    return NextResponse.json({ error: "Erro ao verificar status" }, { status: 500 });
  }
}
