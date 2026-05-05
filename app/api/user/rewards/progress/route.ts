import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { verifySession } from "@/lib/session";

const sql = neon(process.env.DATABASE_URL!);

// Metas de faturamento com recompensas (igual ao admin)
const GOALS = [
  { value: 1000, label: "R$ 1K", reward: null, icon: "target" },
  { value: 10000, label: "R$ 10K", reward: null, icon: "trending" },
  { value: 20000, label: "R$ 20K", reward: "Pulseira", icon: "gift" },
  { value: 50000, label: "R$ 50K", reward: null, icon: "star" },
  { value: 75000, label: "R$ 75K", reward: null, icon: "zap" },
  { value: 100000, label: "R$ 100K", reward: "Placa de 100K", icon: "trophy" },
  { value: 250000, label: "R$ 250K", reward: null, icon: "crown" },
  { value: 375000, label: "R$ 375K", reward: null, icon: "award" },
  { value: 500000, label: "R$ 500K", reward: "Placa de 500K", icon: "trophy" },
  { value: 750000, label: "R$ 750K", reward: null, icon: "crown" },
  { value: 1000000, label: "R$ 1M", reward: "Placa de 1M", icon: "crown" },
];

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Buscar volume total do usuario
    const userVolume = await sql`
      SELECT COALESCE(SUM(amount), 0) as total_volume
      FROM transactions 
      WHERE user_id = ${session.userId} 
      AND type IN ('deposit', 'transfer_in', 'pix_in') 
      AND status = 'completed'
    `;

    const volume = Number(userVolume[0]?.total_volume || 0);

    // Buscar recompensas ja entregues
    let deliveredRewards: { goal_value: number }[] = [];
    try {
      deliveredRewards = await sql`
        SELECT goal_value FROM user_rewards WHERE user_id = ${session.userId}
      `;
    } catch {
      // Tabela pode nao existir
    }

    const deliveredSet = new Set(deliveredRewards.map(r => r.goal_value));

    // Encontrar meta atual e proxima
    let currentGoalIndex = -1;
    for (let i = GOALS.length - 1; i >= 0; i--) {
      if (volume >= GOALS[i].value) {
        currentGoalIndex = i;
        break;
      }
    }

    const currentGoal = currentGoalIndex >= 0 ? GOALS[currentGoalIndex] : null;
    const nextGoal = currentGoalIndex < GOALS.length - 1 ? GOALS[currentGoalIndex + 1] : null;

    // Calcular progresso para proxima meta
    let progressPercent = 0;
    if (nextGoal) {
      const baseValue = currentGoal ? currentGoal.value : 0;
      progressPercent = ((volume - baseValue) / (nextGoal.value - baseValue)) * 100;
      progressPercent = Math.min(Math.max(progressPercent, 0), 100);
    } else {
      progressPercent = 100; // Atingiu todas as metas
    }

    // Construir lista de metas com status
    const rewards = GOALS.map((goal, index) => {
      const isAchieved = volume >= goal.value;
      const isDelivered = deliveredSet.has(goal.value);
      
      let status: "locked" | "in_progress" | "completed" | "claimed" = "locked";
      if (isDelivered && goal.reward) {
        status = "claimed";
      } else if (isAchieved) {
        status = "completed";
      } else if (index === currentGoalIndex + 1) {
        status = "in_progress";
      }

      // Calcular progresso individual
      let goalProgress = 0;
      if (isAchieved) {
        goalProgress = 100;
      } else if (index === currentGoalIndex + 1) {
        const baseValue = currentGoal ? currentGoal.value : 0;
        goalProgress = ((volume - baseValue) / (goal.value - baseValue)) * 100;
        goalProgress = Math.min(Math.max(goalProgress, 0), 100);
      }

      return {
        id: `goal-${index}`,
        name: goal.label,
        description: goal.reward 
          ? `Atinja ${goal.label} em faturamento e ganhe: ${goal.reward}`
          : `Meta de faturamento: ${goal.label}`,
        target_amount: goal.value,
        current_progress: Math.min(volume, goal.value),
        progress_percent: goalProgress,
        reward_type: goal.reward ? "physical" : "milestone",
        reward_name: goal.reward,
        status,
        icon: goal.icon,
        has_reward: !!goal.reward,
        is_delivered: isDelivered,
      };
    });

    // Separar metas com e sem premio
    const rewardsWithPrize = rewards.filter(r => r.has_reward);
    const milestonesOnly = rewards.filter(r => !r.has_reward);

    // Stats do usuario
    const stats = {
      total_volume: volume,
      current_goal: currentGoal,
      next_goal: nextGoal,
      progress_percent: progressPercent,
      goals_achieved: rewards.filter(r => r.status === "completed" || r.status === "claimed").length,
      total_goals: GOALS.length,
      rewards_available: rewardsWithPrize.filter(r => r.status === "completed").length,
      rewards_claimed: rewardsWithPrize.filter(r => r.status === "claimed").length,
    };

    return NextResponse.json({ 
      rewards: rewardsWithPrize,
      milestones: milestonesOnly,
      all_goals: rewards,
      stats,
    });
  } catch (error) {
    console.error("Erro ao buscar premiacoes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
