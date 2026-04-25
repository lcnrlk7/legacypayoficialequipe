import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const transactions = await sql`
      SELECT * FROM transactions WHERE user_id = ${user.id} ORDER BY created_at DESC
    `;

    const withdrawals = await sql`
      SELECT * FROM withdrawals WHERE user_id = ${user.id} ORDER BY created_at DESC
    `;

    const allTransactions = [
      ...transactions.map((tx: Record<string, unknown>) => ({
        id: tx.id,
        type: tx.type || "pix_in",
        amount: Number(tx.amount) || 0,
        fee: Number(tx.fee) || 0,
        net_amount: Number(tx.net_amount) || Number(tx.amount) - Number(tx.fee) || 0,
        status: tx.status || "pending",
        description: tx.description || "Transação PIX",
        created_at: tx.created_at,
        payer_name: tx.payer_name,
        external_id: tx.external_id,
      })),
      ...withdrawals.map((wd: Record<string, unknown>) => ({
        id: wd.id,
        type: "withdrawal",
        amount: Number(wd.amount) || 0,
        fee: Number(wd.fee) || 0,
        net_amount: Number(wd.net_amount) || Number(wd.amount) - Number(wd.fee) || 0,
        status: wd.status || "pending",
        description: wd.description || "Saque PIX",
        created_at: wd.created_at,
        payer_name: wd.recipient_name,
        external_id: wd.pix_key,
      })),
    ].sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());

    const stats = {
      total_pix_in: allTransactions
        .filter((tx) => tx.type === "pix_in" && tx.status === "completed")
        .reduce((acc, tx) => acc + tx.amount, 0),
      total_pix_out: allTransactions
        .filter((tx) => (tx.type === "pix_out" || tx.type === "withdrawal") && tx.status === "completed")
        .reduce((acc, tx) => acc + tx.amount, 0),
      pending_count: allTransactions.filter((tx) => tx.status === "pending").length,
      completed_count: allTransactions.filter((tx) => tx.status === "completed").length,
      cancelled_count: allTransactions.filter((tx) => tx.status === "cancelled" || tx.status === "failed").length,
      total_fees: allTransactions
        .filter((tx) => tx.status === "completed")
        .reduce((acc, tx) => acc + tx.fee, 0),
      total_volume: allTransactions
        .filter((tx) => tx.status === "completed")
        .reduce((acc, tx) => acc + tx.amount, 0),
    };

    return NextResponse.json({ transactions: allTransactions, stats });
  } catch (error) {
    console.error("Error in reports API:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
