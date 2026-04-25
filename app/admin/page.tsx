import { sql } from "@/lib/db";
import { AdminDashboardContent, Transaction, User } from "@/components/admin/dashboard-content";

export default async function AdminDashboardPage() {
  const usersCountResult = await sql`SELECT COUNT(*) as count FROM profiles`;
  const transactionsCountResult = await sql`SELECT COUNT(*) as count FROM transactions`;

  const recentTransactions = await sql`
    SELECT t.*, p.email as user_email, p.name as user_name 
    FROM transactions t
    LEFT JOIN profiles p ON t.user_id = p.id
    ORDER BY t.created_at DESC
    LIMIT 10
  `;

  const recentUsers = await sql`
    SELECT * FROM profiles
    ORDER BY created_at DESC
    LIMIT 5
  `;

  return (
    <AdminDashboardContent
      usersCount={Number(usersCountResult[0]?.count) || 0}
      transactionsCount={Number(transactionsCountResult[0]?.count) || 0}
      recentTransactions={recentTransactions as Transaction[]}
      recentUsers={recentUsers as User[]}
    />
  );
}
