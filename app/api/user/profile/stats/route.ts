import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { verifySession } from "@/lib/session";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Buscar estatisticas do usuario
    const [profileData, transactionStats, withdrawalStats, referralStats, rewardStats] = await Promise.all([
      // Data de criacao do perfil
      sql`
        SELECT created_at FROM profiles WHERE id = ${session.userId}
      `,
      // Total de transacoes e volume
      sql`
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(amount), 0) as total_volume
        FROM transactions 
        WHERE user_id = ${session.userId} AND status IN ('completed', 'paid')
      `,
      // Total sacado
      sql`
        SELECT COALESCE(SUM(amount), 0) as total_withdrawn
        FROM withdrawals 
        WHERE user_id = ${session.userId} AND status = 'completed'
      `,
      // Total de indicados
      sql`
        SELECT COUNT(*) as referral_count
        FROM profiles 
        WHERE referred_by = ${session.userId}
      `,
      // Premios resgatados
      sql`
        SELECT COUNT(*) as rewards_claimed
        FROM user_rewards 
        WHERE user_id = ${session.userId} AND status = 'claimed'
      `.catch(() => [{ rewards_claimed: 0 }]),
    ]);

    const stats = {
      total_transactions: Number(transactionStats[0]?.total_transactions || 0),
      total_volume: Number(transactionStats[0]?.total_volume || 0),
      total_withdrawn: Number(withdrawalStats[0]?.total_withdrawn || 0),
      member_since: profileData[0]?.created_at,
      referral_count: Number(referralStats[0]?.referral_count || 0),
      rewards_claimed: Number(rewardStats[0]?.rewards_claimed || 0),
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Erro ao buscar estatisticas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
