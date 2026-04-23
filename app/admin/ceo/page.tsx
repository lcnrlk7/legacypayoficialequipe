"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  LogOut, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Settings,
  Bell,
  Search,
  MoreVertical,
  ShieldCheck,
  Wallet,
  Rocket,
  FileText,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface AdminSession {
  authenticated: boolean;
  username: string;
  name: string;
  role: string;
  loginAt: string;
}

interface StatsData {
  totalRevenue: string;
  totalUsers: number;
  totalTransactions: number;
  activeToday: number;
  growthRevenue: string;
  growthUsers: string;
  growthTransactions: string;
}

interface Transaction {
  id: string;
  user: string;
  email: string;
  amount: string;
  type: "deposit" | "withdrawal";
  status: string;
  time: string;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  status: string;
  joined: string;
}

export default function CEODashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<StatsData>({
    totalRevenue: "R$ 0,00",
    totalUsers: 0,
    totalTransactions: 0,
    activeToday: 0,
    growthRevenue: "+0%",
    growthUsers: "+0%",
    growthTransactions: "+0%"
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  // Buscar dados do dashboard
  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.recentTransactions) {
          setRecentTransactions(data.recentTransactions);
        }
        if (data.recentUsers) {
          setRecentUsers(data.recentUsers);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  useEffect(() => {
    // Verificar sessão do admin
    const storedSession = localStorage.getItem("admin_session");
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      if (parsed.authenticated) {
        setSession(parsed);
        fetchDashboardData(); // Buscar dados ao carregar
      } else {
        router.push("/admin/login");
      }
    } else {
      router.push("/admin/login");
    }
    setIsLoading(false);

    // Atualizar relógio
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Atualizar dados a cada 30 segundos
    const dataInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(dataInterval);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_session");
    router.push("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo-icon.png"
                  alt="LegacyPay"
                  width={36}
                  height={36}
                />
                <div className="flex items-baseline">
                  <span className="text-lg font-bold text-white">Legacy</span>
                  <span className="text-lg font-bold text-primary">Pay</span>
                </div>
              </Link>
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                <ShieldCheck className="w-[14px] h-[14px] text-red-400" />
                <span className="text-xs font-medium text-red-400">CEO Panel</span>
              </div>
            </div>

            {/* Center - Search */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários, transações..."
                  className="pl-10 bg-secondary border-border"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Time */}
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 opacity-70" />
                {currentTime.toLocaleTimeString("pt-BR")}
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </button>

              {/* Settings */}
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Profile */}
              <div className="flex items-center gap-3 pl-4 border-l border-border">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{session.name}</p>
                  <p className="text-xs text-muted-foreground">{session.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <span className="text-white font-bold">E</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Welcome message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo de volta, {session.name}!
          </h1>
          <p className="text-muted-foreground">
            Aqui está o resumo da LegacyPay hoje, {currentTime.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}.
          </p>
        </motion.div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Receita Total", value: stats.totalRevenue, growth: stats.growthRevenue, icon: Wallet, color: "from-green-500 to-emerald-500" },
            { label: "Total de Usuários", value: stats.totalUsers.toLocaleString(), growth: stats.growthUsers, icon: Users, color: "from-blue-500 to-cyan-500" },
            { label: "Transações", value: stats.totalTransactions.toLocaleString(), growth: stats.growthTransactions, icon: TrendingUp, color: "from-purple-500 to-pink-500" },
            { label: "Ativos Hoje", value: stats.activeToday.toLocaleString(), icon: Rocket, color: "from-orange-500 to-red-500" },
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                {stat.growth && (
                  <span className="text-xs font-medium text-green-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.growth}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          )})}
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Transações Recentes
              </h2>
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todas
              </Button>
            </div>

            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma transação ainda</p>
                </div>
              ) : (
                recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === "deposit" ? "bg-green-500/10" : "bg-red-500/10"
                      }`}>
                        {tx.type === "deposit" ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tx.user}</p>
                        <p className="text-sm text-muted-foreground">{tx.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.type === "deposit" ? "text-green-500" : "text-red-500"}`}>
                        {tx.type === "deposit" ? "+" : "-"}{tx.amount}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {tx.status === "completed" && <CheckCircle className="w-3 h-3 text-green-500" />}
                        {tx.status === "pending" && <Clock className="w-3 h-3 text-yellow-500" />}
                        {tx.status === "processing" && <Activity className="w-3 h-3 text-blue-500" />}
                        <span>{tx.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Novos Usuários
              </h2>
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todos
              </Button>
            </div>

            <div className="space-y-4">
              {recentUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum usuário ainda</p>
                </div>
              ) : (
                recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.status === "active" ? (
                        <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full">Ativo</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full">KYC</span>
                      )}
                      <button className="p-1 hover:bg-secondary rounded">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick actions */}
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-foreground mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1">
                  <Settings className="w-4 h-4 opacity-70" />
                  <span className="text-xs">Configurações</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1">
                  <FileText className="w-4 h-4 opacity-70" />
                  <span className="text-xs">Relatórios</span>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              Sessão iniciada em: {new Date(session.loginAt).toLocaleString("pt-BR")}
            </p>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-[14px] h-[14px] opacity-50" />
              <span>Conexão segura e criptografada</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
