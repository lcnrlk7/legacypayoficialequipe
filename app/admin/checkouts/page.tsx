import { neon } from "@neondatabase/serverless";
import { AdminCheckoutsContent } from "@/components/admin/checkouts-content";

export const dynamic = "force-dynamic";

async function getCheckoutStats() {
  const sql = neon(process.env.DATABASE_URL!);

  // Get checkouts with owner info
  const checkouts = await sql`
    SELECT 
      c.*,
      p.email as owner_email,
      p.name as owner_name,
      (SELECT COUNT(*) FROM checkout_product_items WHERE checkout_id = c.id) as products_count,
      (SELECT COUNT(*) FROM checkout_orders WHERE checkout_id = c.id) as orders_count,
      (SELECT COALESCE(SUM(total), 0) FROM checkout_orders WHERE checkout_id = c.id AND status = 'paid') as total_revenue
    FROM checkouts c
    LEFT JOIN profiles p ON c.user_id = p.id
    ORDER BY c.created_at DESC
    LIMIT 100
  `;

  // Get products
  const products = await sql`
    SELECT 
      cp.*,
      p.email as owner_email,
      p.name as owner_name
    FROM checkout_products cp
    LEFT JOIN profiles p ON cp.user_id = p.id
    ORDER BY cp.created_at DESC
    LIMIT 100
  `;

  // Get recent orders
  const orders = await sql`
    SELECT 
      co.*,
      c.name as checkout_name,
      c.slug as checkout_slug,
      p.email as seller_email
    FROM checkout_orders co
    LEFT JOIN checkouts c ON co.checkout_id = c.id
    LEFT JOIN profiles p ON co.seller_id = p.id
    ORDER BY co.created_at DESC
    LIMIT 50
  `;

  // Get stats
  const stats = await sql`
    SELECT 
      (SELECT COUNT(*) FROM checkouts) as total_checkouts,
      (SELECT COUNT(*) FROM checkout_products) as total_products,
      (SELECT COUNT(*) FROM checkout_orders) as total_orders,
      (SELECT COALESCE(SUM(total), 0) FROM checkout_orders WHERE status = 'paid') as total_revenue,
      (SELECT COUNT(*) FROM checkout_orders WHERE status = 'paid') as paid_orders,
      (SELECT COUNT(*) FROM checkout_orders WHERE status = 'pending') as pending_orders
  `;

  return {
    checkouts,
    products,
    orders,
    stats: stats[0] || {
      total_checkouts: 0,
      total_products: 0,
      total_orders: 0,
      total_revenue: 0,
      paid_orders: 0,
      pending_orders: 0,
    },
  };
}

export default async function AdminCheckoutsPage() {
  const data = await getCheckoutStats();

  return <AdminCheckoutsContent 
    checkouts={data.checkouts as any[]}
    products={data.products as any[]}
    orders={data.orders as any[]}
    stats={data.stats as any}
  />;
}
