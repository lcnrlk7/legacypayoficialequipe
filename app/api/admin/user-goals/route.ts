import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Metas de faturamento com recompensas
export const GOALS = [
  { value: 1000, label: "R$ 1K", reward: null },
  { value: 10000, label: "R$ 10K", reward: null },
  { value: 20000, label: "R$ 20K", reward: "Pulseira" },
  { value: 50000, label: "R$ 50K", reward: null },
  { value: 75000, label: "R$ 75K", reward: null },
  { value: 100000, label: "R$ 100K", reward: "Placa de 100K" },
  { value: 250000, label: "R$ 250K", reward: null },
  { value: 375000, label: "R$ 375K", reward: null },
  { value: 500000, label: "R$ 500K", reward: "Placa de 500K" },
  { value: 750000, label: "R$ 750K", reward: null },
  { value: 1000000, label: "R$ 1M", reward: "Placa de 1M" },
];

export function getCurrentGoal(revenue: number) {
  // Encontra a maior meta atingida
  let currentGoal = null;
  for (let i = GOALS.length - 1; i >= 0; i--) {
    if (revenue >= GOALS[i].value) {
      currentGoal = GOALS[i];
      break;
    }
  }
  return currentGoal;
}

export function getNextGoal(revenue: number) {
  // Encontra a proxima meta
  for (const goal of GOALS) {
    if (revenue < goal.value) {
      return goal;
    }
  }
  return null; // Ja atingiu todas
}

export function getProgress(revenue: number) {
  const nextGoal = getNextGoal(revenue);
  if (!nextGoal) return 100;

  const currentGoal = getCurrentGoal(revenue);
  const baseValue = currentGoal ? currentGoal.value : 0;
  
  const progress = ((revenue - baseValue) / (nextGoal.value - baseValue)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // "all" | "with_goals" | "pending_rewards"
    const search = searchParams.get("search");

    // Buscar usuarios com faturamento total calculado das transacoes
    const usersResult = await sql`
      SELECT 
        p.id,
        p.name,
        p.email,
        p.phone,
        p.created_at,
        COALESCE(p.total_revenue, 0) as profile_revenue,
        COALESCE(
          (SELECT SUM(amount) 
           FROM transactions 
           WHERE user_id = p.id 
           AND type IN ('deposit', 'transfer_in', 'pix_in') 
           AND status = 'completed'
          ), 0
        ) as calculated_revenue
      FROM profiles p
      WHERE p.is_admin = false OR p.is_admin IS NULL
      ORDER BY calculated_revenue DESC
    `;

    // Extrair rows do resultado
    const users = usersResult.rows || usersResult || [];
    
    console.log("[v0] Users found:", users.length);

    // Buscar recompensas ja entregues
    let deliveredRewards: any[] = [];
    try {
      const rewardsResult = await sql`SELECT user_id, goal_value FROM user_rewards`;
      deliveredRewards = rewardsResult.rows || rewardsResult || [];
    } catch (e) {
      // Table may not exist yet
      console.log("[v0] user_rewards table not found, skipping");
    }

    // Criar um Set para lookup rapido
    const deliveredSet = new Set(
      deliveredRewards.map((r: any) => `${r.user_id}-${r.goal_value}`)
    );

    // Calcular metas para cada usuario
    const usersArray = Array.isArray(users) ? users : [];
    const usersWithGoals = usersArray.map((user: any) => {
      // Usar o maior valor entre profile_revenue e calculated_revenue
      const totalRevenue = Math.max(
        Number(user.profile_revenue) || 0,
        Number(user.calculated_revenue) || 0
      );

      const currentGoal = getCurrentGoal(totalRevenue);
      const nextGoal = getNextGoal(totalRevenue);
      const progress = getProgress(totalRevenue);

      // Encontrar todas as metas atingidas com recompensa
      const achievedRewards = GOALS.filter(
        g => g.reward && totalRevenue >= g.value
      ).map(g => ({
        ...g,
        delivered: deliveredSet.has(`${user.id}-${g.value}`)
      }));

      // Recompensas pendentes = atingidas mas nao entregues
      const pendingRewards = achievedRewards.filter(r => !r.delivered);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        total_revenue: totalRevenue,
        current_goal: currentGoal,
        next_goal: nextGoal,
        progress,
        achieved_rewards: achievedRewards,
        pending_rewards: pendingRewards,
        has_pending_rewards: pendingRewards.length > 0,
      };
    });

    // Aplicar filtros
    let filtered = usersWithGoals;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((u: any) =>
        u.name?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.phone?.includes(search)
      );
    }

    if (filter === "with_goals") {
      filtered = filtered.filter((u: any) => u.current_goal !== null);
    } else if (filter === "pending_rewards") {
      filtered = filtered.filter((u: any) => u.has_pending_rewards);
    }

    // Stats
    const stats = {
      total_users: usersWithGoals.length,
      users_with_goals: usersWithGoals.filter((u: any) => u.current_goal !== null).length,
      users_with_pending_rewards: usersWithGoals.filter((u: any) => u.has_pending_rewards).length,
      total_revenue: usersWithGoals.reduce((sum: number, u: any) => sum + u.total_revenue, 0),
    };

    return NextResponse.json({
      users: filtered,
      stats,
      goals: GOALS,
    });
  } catch (error) {
    console.error("Error in user-goals API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Marcar recompensa como entregue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, goal_value, reward_delivered } = body;

    // Aqui poderiamos salvar em uma tabela de recompensas entregues
    // Por enquanto, vamos apenas retornar sucesso
    // TODO: Criar tabela user_rewards_delivered

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking reward:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
