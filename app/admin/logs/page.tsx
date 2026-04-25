import { neon } from "@neondatabase/serverless";
import { AdminLogsContent } from "@/components/admin/logs-content";

export const dynamic = "force-dynamic";

async function getLogs() {
  const sql = neon(process.env.DATABASE_URL!);

  const logs = await sql`
    SELECT 
      l.*,
      p.email as user_email,
      p.name as user_name
    FROM admin_logs l
    LEFT JOIN profiles p ON l.user_id = p.id
    ORDER BY l.created_at DESC
    LIMIT 200
  `;

  const stats = await sql`
    SELECT 
      (SELECT COUNT(*) FROM admin_logs WHERE created_at > NOW() - INTERVAL '24 hours') as logs_24h,
      (SELECT COUNT(*) FROM admin_logs WHERE type = 'checkout_order') as total_orders,
      (SELECT COUNT(*) FROM admin_logs WHERE type = 'pix_payment' AND action = 'paid') as total_paid,
      (SELECT COALESCE(SUM(amount), 0) FROM admin_logs WHERE type = 'checkout_order') as total_amount
  `;

  return {
    logs,
    stats: stats[0] || { logs_24h: 0, total_orders: 0, total_paid: 0, total_amount: 0 },
  };
}

export default async function AdminLogsPage() {
  const data = await getLogs();

  return <AdminLogsContent 
    logs={data.logs as any[]}
    stats={data.stats as any}
  />;
}
