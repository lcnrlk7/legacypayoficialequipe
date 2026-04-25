import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { TransactionsContent, Transaction } from "@/components/dashboard/transactions-content";

export default async function TransactionsPage() {
  const session = await getSession();

  if (!session) {
    return <TransactionsContent transactions={[]} />;
  }

  const transactions = await sql`
    SELECT * FROM transactions 
    WHERE user_id = ${session.userId}
    ORDER BY created_at DESC
  `;

  return <TransactionsContent transactions={(transactions || []) as Transaction[]} />;
}
