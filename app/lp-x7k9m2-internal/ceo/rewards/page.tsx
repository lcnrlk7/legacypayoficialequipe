"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  Users,
  TrendingUp,
  Search,
  Loader2,
  Gift,
  CheckCircle,
  Clock,
  Star,
  Phone,
  Mail,
  User,
  Filter,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface Goal {
  value: number;
  label: string;
  reward: string | null;
}

interface UserGoal {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  total_revenue: number;
  current_goal: Goal | null;
  next_goal: Goal | null;
  progress: number;
  achieved_rewards: Goal[];
  has_pending_rewards: boolean;
}

interface Stats {
  total_users: number;
  users_with_goals: number;
  users_with_pending_rewards: number;
  total_revenue: number;
}

export default function UserGoalsPage() {
  const [users, setUsers] = useState<UserGoal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "with_goals" | "pending_rewards">("all");

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/user-goals?filter=${filter}`);
      const data = await res.json();
      setUsers(data.users || []);
      setStats(data.stats || null);
      setGoals(data.goals || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.phone?.includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Acompanhamento de Metas
        </h1>
        <p className="text-muted-foreground">
          Visualize o progresso de faturamento dos usuarios e metas atingidas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats?.total_users || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total de Usuarios</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats?.users_with_goals || 0}
              </p>
              <p className="text-sm text-muted-foreground">Com Metas Atingidas</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Gift className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats?.users_with_pending_rewards || 0}
              </p>
              <p className="text-sm text-muted-foreground">Recompensas Pendentes</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats?.total_revenue || 0)}
              </p>
              <p className="text-sm text-muted-foreground">Faturamento Total</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Goals Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Metas de Faturamento
        </h3>
        <div className="flex flex-wrap gap-3">
          {goals.map((goal) => (
            <div
              key={goal.value}
              className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                goal.reward
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {goal.reward && <Gift className="w-4 h-4" />}
              <span>{goal.label}</span>
              {goal.reward && (
                <span className="text-xs opacity-70">({goal.reward})</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email ou telefone..."
            className="bg-secondary pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            size="sm"
          >
            <Users className="w-4 h-4 mr-2" />
            Todos
          </Button>
          <Button
            variant={filter === "with_goals" ? "default" : "outline"}
            onClick={() => setFilter("with_goals")}
            size="sm"
          >
            <Target className="w-4 h-4 mr-2" />
            Com Metas
          </Button>
          <Button
            variant={filter === "pending_rewards" ? "default" : "outline"}
            onClick={() => setFilter("pending_rewards")}
            size="sm"
            className={filter === "pending_rewards" ? "" : "text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10"}
          >
            <Gift className="w-4 h-4 mr-2" />
            Com Recompensas
          </Button>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum usuario encontrado</p>
          </div>
        ) : (
          filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-card border rounded-2xl p-5 ${
                user.has_pending_rewards
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : "border-border"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* User Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`p-3 rounded-xl shrink-0 ${
                    user.current_goal 
                      ? "bg-green-500/10" 
                      : "bg-secondary"
                  }`}>
                    <User className={`w-6 h-6 ${
                      user.current_goal ? "text-green-500" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">
                      {user.name || "Sem nome"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        {user.email}
                      </span>
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 shrink-0" />
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Revenue */}
                <div className="lg:text-right shrink-0">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrencyFull(user.total_revenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">Faturamento Total</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {user.current_goal ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500 font-medium">
                          Meta atingida: {user.current_goal.label}
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Nenhuma meta atingida ainda
                        </span>
                      </>
                    )}
                  </div>
                  {user.next_goal && (
                    <span className="text-sm text-muted-foreground">
                      Proxima: {user.next_goal.label}
                    </span>
                  )}
                </div>
                <Progress value={user.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {user.progress.toFixed(0)}% para a proxima meta
                </p>
              </div>

              {/* Achieved Rewards */}
              {user.achieved_rewards.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    Recompensas a Entregar:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.achieved_rewards.map((reward) => (
                      <div
                        key={reward.value}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                      >
                        <Gift className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-yellow-500 font-medium">
                          {reward.reward}
                        </span>
                        <span className="text-xs text-yellow-500/70">
                          ({reward.label})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
