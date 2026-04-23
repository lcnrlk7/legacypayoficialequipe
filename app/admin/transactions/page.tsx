import { sql } from "@/lib/db";
import { AdminTransactionsContent, Transaction } from "@/components/admin/transactions-content";

export const dynamic = 'force-dynamic';

export default async function AdminTransactionsPage() {
  const transactions = await sql`
    SELECT t.*, p.email, p.name 
    FROM transactions t
    LEFT JOIN profiles p ON t.user_id = p.id
    ORDER BY t.created_at DESC
    LIMIT 100
  `;

  return <AdminTransactionsContent transactions={transactions as Transaction[]} />;
}
