import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Buscar pedidos onde o email do usuario corresponde ao email do cliente
    const orders = await sql`
      SELECT 
        co.id,
        co.id as order_id,
        co.customer_name,
        co.customer_email,
        co.customer_phone,
        co.shipping_address,
        co.shipping_city,
        co.shipping_state,
        co.shipping_zip,
        co.subtotal,
        co.discount,
        co.total,
        co.payment_status,
        co.delivery_status,
        co.tracking_code,
        co.status,
        co.created_at,
        co.updated_at,
        c.name as checkout_name,
        u.name as seller_name,
        (
          SELECT json_agg(json_build_object(
            'id', coi.id,
            'product_name', cp.name,
            'product_image', cp.image_url,
            'quantity', coi.quantity,
            'price', coi.price
          ))
          FROM checkout_order_items coi
          LEFT JOIN checkout_products cp ON coi.product_id = cp.id
          WHERE coi.order_id = co.id
        ) as items
      FROM checkout_orders co
      LEFT JOIN checkouts c ON co.checkout_id = c.id
      LEFT JOIN users u ON co.seller_id = u.id
      WHERE co.customer_email = ${user.email}
      ORDER BY co.created_at DESC
      LIMIT 50
    `;

    // Formatar os dados para o frontend
    const formattedOrders = orders.map((order: any) => {
      const firstItem = order.items?.[0];
      return {
        id: order.id,
        order_id: order.order_id,
        product_name: firstItem?.product_name || order.checkout_name || "Produto",
        product_image: firstItem?.product_image,
        quantity: firstItem?.quantity || 1,
        total: order.total,
        delivery_status: order.delivery_status || "pending",
        tracking_code: order.tracking_code,
        shipping_address: order.shipping_address,
        shipping_city: order.shipping_city,
        shipping_state: order.shipping_state,
        shipping_zip: order.shipping_zip,
        created_at: order.created_at,
        updated_at: order.updated_at,
        seller_name: order.seller_name,
        payment_status: order.payment_status,
        items: order.items,
      };
    });

    return NextResponse.json({ orders: formattedOrders });
  } catch (error) {
    console.error("[my-orders] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pedidos" },
      { status: 500 }
    );
  }
}
