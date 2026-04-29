import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Verificar se e admin
    const admin = await verifyAdmin();
    if (!admin) return accessDeniedResponse();
    // Buscar dados agregados de taxas por usuário (apenas transações aprovadas/completed)
    const userFeesData = await sql`
      SELECT 
        p.id as user_id,
        p.name,
        p.email,
        p.fee_percentage as current_fee_percentage,
        p.route_type,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.fee ELSE 0 END), 0) as total_fees_paid,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END), 0) as total_volume,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as total_transactions,
        MAX(CASE WHEN t.status = 'completed' THEN t.created_at END) as last_transaction_at
      FROM profiles p
      LEFT JOIN transactions t ON p.id = t.user_id
      GROUP BY p.id, p.name, p.email, p.fee_percentage, p.route_type
      ORDER BY total_fees_paid DESC
    `;

    // Formatar dados
    const users = userFeesData.map((row: {
      user_id: string;
      name: string | null;
      email: string;
      current_fee_percentage: number | null;
      route_type: string;
      total_fees_paid: string;
      total_volume: string;
      total_transactions: string;
      last_transaction_at: string | null;
    }) => ({
      user_id: row.user_id,
      name: row.name,
      email: row.email,
      fee_percentage: Number(row.current_fee_percentage) || 2.5,
      route_type: row.route_type || 'white',
      total_fees_paid: Number(row.total_fees_paid) || 0,
      total_volume: Number(row.total_volume) || 0,
      total_transactions: Number(row.total_transactions) || 0,
      last_transaction_at: row.last_transaction_at,
    }));

    // Calcular totais da plataforma
    const totalFeesCollected = users.reduce((acc: number, u: { total_fees_paid: number }) => acc + u.total_fees_paid, 0);
    const totalVolume = users.reduce((acc: number, u: { total_volume: number }) => acc + u.total_volume, 0);
    const totalTransactions = users.reduce((acc: number, u: { total_transactions: number }) => acc + u.total_transactions, 0);
    
    // Calcular taxa média ponderada (baseada no volume)
    const averageFeePercentage = totalVolume > 0 
      ? (totalFeesCollected / totalVolume) * 100 
      : 0;

    // Filtrar apenas usuários com transações (opcional - pode mostrar todos)
    const activeUsers = users.filter((u: { total_transactions: number }) => u.total_transactions > 0);

    return NextResponse.json({
      users: activeUsers,
      allUsers: users,
      summary: {
        totalFeesCollected,
        totalVolume,
        totalTransactions,
        averageFeePercentage,
        activeUsersCount: activeUsers.length,
        totalUsersCount: users.length,
      },
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.error("Error in admin fees API:", error);
    return NextResponse.json(
      { error: "Erro ao buscar taxas" },
      { status: 500 }
    );
  }
}
