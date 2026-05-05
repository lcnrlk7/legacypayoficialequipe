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

    // Buscar premiacoes ativas
    const activeRewards = await sql`
      SELECT * FROM rewards 
      WHERE is_active = true 
      AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY target_amount ASC
    `.catch(() => []);

    // Se nao tem tabela de rewards, criar premiacoes padrao dinamicas
    if (activeRewards.length === 0) {
      // Buscar volume do usuario para calcular progresso
      const userVolume = await sql`
        SELECT COALESCE(SUM(amount), 0) as total_volume
        FROM transactions 
        WHERE user_id = ${session.userId} AND status IN ('completed', 'paid')
      `;

      const volume = Number(userVolume[0]?.total_volume || 0);

      // Premiacoes padrao baseadas em volume
      const defaultRewards = [
        {
          id: "default-1",
          name: "Primeiros Passos",
          description: "Processe R$ 1.000 em transacoes",
          target_amount: 1000,
          current_progress: Math.min(volume, 1000),
          reward_type: "cash",
          reward_value: 10,
          status: volume >= 1000 ? "completed" : "in_progress",
          icon: "star",
        },
        {
          id: "default-2",
          name: "Trader Bronze",
          description: "Processe R$ 5.000 em transacoes",
          target_amount: 5000,
          current_progress: Math.min(volume, 5000),
          reward_type: "cash",
          reward_value: 25,
          status: volume >= 5000 ? "completed" : "in_progress",
          icon: "trophy",
        },
        {
          id: "default-3",
          name: "Trader Prata",
          description: "Processe R$ 10.000 em transacoes",
          target_amount: 10000,
          current_progress: Math.min(volume, 10000),
          reward_type: "cash",
          reward_value: 50,
          status: volume >= 10000 ? "completed" : "in_progress",
          icon: "gift",
        },
        {
          id: "default-4",
          name: "Trader Ouro",
          description: "Processe R$ 50.000 em transacoes",
          target_amount: 50000,
          current_progress: Math.min(volume, 50000),
          reward_type: "cash",
          reward_value: 150,
          status: volume >= 50000 ? "completed" : "in_progress",
          icon: "crown",
        },
        {
          id: "default-5",
          name: "Trader Diamante",
          description: "Processe R$ 100.000 em transacoes",
          target_amount: 100000,
          current_progress: Math.min(volume, 100000),
          reward_type: "cash",
          reward_value: 500,
          status: volume >= 100000 ? "completed" : "in_progress",
          icon: "zap",
        },
      ];

      return NextResponse.json({ rewards: defaultRewards });
    }

    // Buscar progresso do usuario em cada premiacao
    const rewards = await Promise.all(
      activeRewards.map(async (reward) => {
        // Calcular progresso baseado no tipo de meta
        let currentProgress = 0;

        if (reward.goal_type === "volume") {
          const result = await sql`
            SELECT COALESCE(SUM(amount), 0) as progress
            FROM transactions 
            WHERE user_id = ${session.userId} 
            AND status IN ('completed', 'paid')
            AND created_at >= COALESCE(${reward.start_date}, '1970-01-01')
          `;
          currentProgress = Number(result[0]?.progress || 0);
        } else if (reward.goal_type === "transactions") {
          const result = await sql`
            SELECT COUNT(*) as progress
            FROM transactions 
            WHERE user_id = ${session.userId} 
            AND status IN ('completed', 'paid')
            AND created_at >= COALESCE(${reward.start_date}, '1970-01-01')
          `;
          currentProgress = Number(result[0]?.progress || 0);
        } else if (reward.goal_type === "referrals") {
          const result = await sql`
            SELECT COUNT(*) as progress
            FROM profiles 
            WHERE referred_by = ${session.userId}
            AND created_at >= COALESCE(${reward.start_date}, '1970-01-01')
          `;
          currentProgress = Number(result[0]?.progress || 0);
        }

        // Verificar se ja foi resgatado
        const claimed = await sql`
          SELECT status FROM user_rewards 
          WHERE user_id = ${session.userId} AND reward_id = ${reward.id}
        `.catch(() => []);

        let status = "in_progress";
        if (claimed.length > 0 && claimed[0].status === "claimed") {
          status = "claimed";
        } else if (currentProgress >= reward.target_amount) {
          status = "completed";
        }

        return {
          id: reward.id,
          name: reward.name,
          description: reward.description,
          target_amount: reward.target_amount,
          current_progress: currentProgress,
          reward_type: reward.reward_type,
          reward_value: reward.reward_value,
          status,
          icon: reward.icon || "trophy",
          expires_at: reward.expires_at,
        };
      })
    );

    return NextResponse.json({ rewards });
  } catch (error) {
    console.error("Erro ao buscar premiacoes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
