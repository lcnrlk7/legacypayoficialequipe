import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Verificar se e admin
    const admin = await verifyAdmin();
    if (!admin) return accessDeniedResponse();

    // Buscar taxas de deposito (transactions) por usuario
    const depositFeesData = await sql`
      SELECT 
        p.id as user_id,
        p.name,
        p.email,
        p.fee_percentage as current_fee_percentage,
        p.route_type,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.fee ELSE 0 END), 0) as deposit_fees,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END), 0) as deposit_volume,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as deposit_transactions,
        MAX(CASE WHEN t.status = 'completed' THEN t.created_at END) as last_deposit_at
      FROM profiles p
      LEFT JOIN transactions t ON p.id = t.user_id AND t.type = 'pix_in'
      GROUP BY p.id, p.name, p.email, p.fee_percentage, p.route_type
    `;

    // Buscar taxas de saque (withdrawals) por usuario
    const withdrawalFeesData = await sql`
      SELECT 
        user_id,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN fee ELSE 0 END), 0) as withdrawal_fees,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as withdrawal_volume,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as withdrawal_transactions,
        MAX(CASE WHEN status = 'completed' THEN created_at END) as last_withdrawal_at
      FROM withdrawals
      GROUP BY user_id
    `;

    // Criar map de taxas de saque por user_id
    const withdrawalMap = new Map<string, {
      withdrawal_fees: number;
      withdrawal_volume: number;
      withdrawal_transactions: number;
      last_withdrawal_at: string | null;
    }>();
    
    for (const row of withdrawalFeesData) {
      withdrawalMap.set(row.user_id, {
        withdrawal_fees: Number(row.withdrawal_fees) || 0,
        withdrawal_volume: Number(row.withdrawal_volume) || 0,
        withdrawal_transactions: Number(row.withdrawal_transactions) || 0,
        last_withdrawal_at: row.last_withdrawal_at,
      });
    }

    // Combinar dados de deposito e saque
    const users = depositFeesData.map((row: {
      user_id: string;
      name: string | null;
      email: string;
      current_fee_percentage: number | null;
      route_type: string;
      deposit_fees: string;
      deposit_volume: string;
      deposit_transactions: string;
      last_deposit_at: string | null;
    }) => {
      const withdrawalData = withdrawalMap.get(row.user_id) || {
        withdrawal_fees: 0,
        withdrawal_volume: 0,
        withdrawal_transactions: 0,
        last_withdrawal_at: null,
      };

      const depositFees = Number(row.deposit_fees) || 0;
      const depositVolume = Number(row.deposit_volume) || 0;
      const depositTransactions = Number(row.deposit_transactions) || 0;

      // Determinar ultima transacao (deposito ou saque, o mais recente)
      let lastTransactionAt = row.last_deposit_at;
      if (withdrawalData.last_withdrawal_at) {
        if (!lastTransactionAt || new Date(withdrawalData.last_withdrawal_at) > new Date(lastTransactionAt)) {
          lastTransactionAt = withdrawalData.last_withdrawal_at;
        }
      }

      return {
        user_id: row.user_id,
        name: row.name,
        email: row.email,
        fee_percentage: Number(row.current_fee_percentage) || 2.5,
        route_type: row.route_type || 'white',
        // Taxas separadas
        deposit_fees: depositFees,
        withdrawal_fees: withdrawalData.withdrawal_fees,
        // Total combinado
        total_fees_paid: depositFees + withdrawalData.withdrawal_fees,
        // Volumes separados
        deposit_volume: depositVolume,
        withdrawal_volume: withdrawalData.withdrawal_volume,
        total_volume: depositVolume + withdrawalData.withdrawal_volume,
        // Transacoes separadas
        deposit_transactions: depositTransactions,
        withdrawal_transactions: withdrawalData.withdrawal_transactions,
        total_transactions: depositTransactions + withdrawalData.withdrawal_transactions,
        last_transaction_at: lastTransactionAt,
      };
    });

    // Calcular totais da plataforma
    const totalDepositFees = users.reduce((acc: number, u: { deposit_fees: number }) => acc + u.deposit_fees, 0);
    const totalWithdrawalFees = users.reduce((acc: number, u: { withdrawal_fees: number }) => acc + u.withdrawal_fees, 0);
    const totalFeesCollected = totalDepositFees + totalWithdrawalFees;
    
    const totalDepositVolume = users.reduce((acc: number, u: { deposit_volume: number }) => acc + u.deposit_volume, 0);
    const totalWithdrawalVolume = users.reduce((acc: number, u: { withdrawal_volume: number }) => acc + u.withdrawal_volume, 0);
    const totalVolume = totalDepositVolume + totalWithdrawalVolume;
    
    const totalDepositTransactions = users.reduce((acc: number, u: { deposit_transactions: number }) => acc + u.deposit_transactions, 0);
    const totalWithdrawalTransactions = users.reduce((acc: number, u: { withdrawal_transactions: number }) => acc + u.withdrawal_transactions, 0);
    const totalTransactions = totalDepositTransactions + totalWithdrawalTransactions;
    
    // Calcular taxa média ponderada (baseada no volume)
    const averageFeePercentage = totalVolume > 0 
      ? (totalFeesCollected / totalVolume) * 100 
      : 0;

    // Filtrar apenas usuários com transações
    const activeUsers = users.filter((u: { total_transactions: number }) => u.total_transactions > 0);

    return NextResponse.json({
      users: activeUsers,
      allUsers: users,
      summary: {
        totalFeesCollected,
        totalDepositFees,
        totalWithdrawalFees,
        totalVolume,
        totalDepositVolume,
        totalWithdrawalVolume,
        totalTransactions,
        totalDepositTransactions,
        totalWithdrawalTransactions,
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
