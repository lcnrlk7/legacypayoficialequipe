"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Key,
  Clock,
  Copy,
  Calendar,
  ChevronDown,
  CheckCircle,
  XCircle,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RewardsProgress } from "./rewards-progress";
import { UserNotificationsBanner } from "./user-notifications-banner";
import { useProfile } from "@/components/profile-provider";

export interface Profile {
  id: string;
  balance: number;
  api_key: string;
  name: string | null;
  total_revenue?: number;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  fee?: number;
  net_amount?: number;
  status: string;
  created_at: string;
  description: string | null;
}

export interface PixKey {
  id: string;
  key_type: string;
  key_value: string;
  is_active: boolean;
}

interface DashboardContentProps {
  profile: Profile | null;
  transactions: Transaction[];
  pixKeys: PixKey[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "pending":
    case "processing":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "failed":
    case "cancelled":
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "deposit":
    case "transfer_in":
    case "pix_in":
      return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
    case "withdrawal":
    case "transfer_out":
    case "pix_out":
      return <ArrowUpRight className="w-5 h-5 text-red-500" />;
    default:
      return <ArrowUpRight className="w-5 h-5 text-muted-foreground" />;
  }
};

const isIncomingType = (type: string) => {
  return ["deposit", "transfer_in", "pix_in"].includes(type);
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "deposit":
    case "pix_in":
      return "Depósito PIX";
    case "withdrawal":
    case "pix_out":
      return "Saque PIX";
    case "transfer_in":
      return "Transferência Recebida";
    case "transfer_out":
      return "Transferência Enviada";
    default:
      return type;
  }
};

type PeriodFilter = "today" | "week" | "month" | "year" | "all";

const periodLabels: Record<PeriodFilter, string> = {
  today: "Hoje",
  week: "Esta semana",
  month: "Este mês",
  year: "Este ano",
  all: "Todo período",
};

function getDateRange(period: PeriodFilter): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  switch (period) {
    case "today":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
        end,
      };
    case "week":
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return { start: weekStart, end };
    case "month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
        end,
      };
    case "year":
      return {
        start: new Date(now.getFullYear(), 0, 1, 0, 0, 0),
        end,
      };
    case "all":
    default:
      return {
        start: new Date(0),
        end,
      };
  }
}

export function DashboardContent({
  profile: serverProfile,
  transactions,
  pixKeys,
}: DashboardContentProps) {
  const { profile: contextProfile, updateBalance } = useProfile();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  // Sincronizar saldo do servidor com o contexto global
  // Isso garante que quando o Server Component traz dados novos, o contexto é atualizado
  useEffect(() => {
    if (serverProfile?.balance !== undefined) {
      const serverBalance = Number(serverProfile.balance) || 0;
      const contextBalance = Number(contextProfile?.balance) || 0;
      
      // Se o saldo do servidor é diferente, atualiza o contexto
      if (serverBalance !== contextBalance) {
        updateBalance(serverBalance);
      }
    }
  }, [serverProfile?.balance, contextProfile?.balance, updateBalance]);

  // Usar o saldo do contexto (mais atualizado) ou do servidor como fallback
  const currentBalance = contextProfile?.balance ?? serverProfile?.balance ?? 0;
  const profile = serverProfile ? { ...serverProfile, balance: Number(currentBalance) } : null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const { totalReceivedGross, totalReceivedNet, totalSent, filteredTransactions } = useMemo(() => {
    const { start, end } = getDateRange(periodFilter);
    
    const filtered = transactions.filter((t) => {
      const txDate = new Date(t.created_at);
      return txDate >= start && txDate <= end;
    });

    // Calcular valor bruto (amount) e líquido (net_amount ou amount - fee)
    const completedDeposits = filtered.filter(
      (t) => ["deposit", "transfer_in", "pix_in"].includes(t.type) && t.status === "completed"
    );

    const receivedGross = completedDeposits.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    const receivedNet = completedDeposits.reduce((sum, t) => {
      // Se tem net_amount, usa ele; senão calcula: amount - fee
      const netValue = t.net_amount !== undefined 
        ? Number(t.net_amount) 
        : (Number(t.amount) || 0) - (Number(t.fee) || 0);
      return sum + (netValue || 0);
    }, 0);

    // Calcular valor líquido dos saques (net_amount = valor que o usuário recebeu, sem taxas)
    const sent = filtered
      .filter((t) => ["withdrawal", "transfer_out", "pix_out"].includes(t.type) && t.status === "completed")
      .reduce((sum, t) => {
        // Se tem net_amount, usa ele; senão calcula: amount - fee
        const netValue = t.net_amount !== undefined 
          ? Number(t.net_amount) 
          : (Number(t.amount) || 0) - (Number(t.fee) || 0);
        return sum + (netValue || 0);
      }, 0);

    return { 
      totalReceivedGross: receivedGross, 
      totalReceivedNet: receivedNet, 
      totalSent: sent, 
      filteredTransactions: filtered 
    };
  }, [transactions, periodFilter]);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 overflow-x-hidden">
      {/* Notifications Banner */}
      {profile && <UserNotificationsBanner userId={profile.id} />}

      {/* Welcome */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          Olá, {profile?.name || "Usuário"}!
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Bem-vindo ao seu painel de controle
        </p>
      </div>
      
      {/* Rewards Progress */}
      {profile && (
        <RewardsProgress 
          totalRevenue={profile.total_revenue || totalReceivedGross} 
          userId={profile.id} 
        />
      )}

      {/* Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Resumo Financeiro</h2>
        <div className="relative">
          <button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary border border-border rounded-xl text-xs sm:text-sm text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            {periodLabels[periodFilter]}
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground transition-transform ${showPeriodDropdown ? "rotate-180" : ""}`} />
          </button>
          {showPeriodDropdown && (
            <div className="absolute right-0 top-full mt-2 w-40 sm:w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              {(Object.keys(periodLabels) as PeriodFilter[]).map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setPeriodFilter(period);
                    setShowPeriodDropdown(false);
                  }}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-xs sm:text-sm hover:bg-secondary transition-colors ${
                    periodFilter === period ? "bg-primary/10 text-primary" : "text-foreground"
                  }`}
                >
                  {periodLabels[period]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground">Saldo</span>
          </div>
          <p className="text-sm sm:text-2xl font-bold text-primary truncate">
            {formatCurrency(profile?.balance || 0)}
          </p>
          <p className="text-[10px] sm:text-sm text-green-500 mt-0.5 sm:mt-1">Disponível para saque</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <ArrowDownLeft className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate ml-1">Bruto</span>
          </div>
          <p className="text-sm sm:text-2xl font-bold text-foreground truncate">
            {formatCurrency(totalReceivedGross)}
          </p>
          <p className="text-[10px] sm:text-sm text-blue-500 mt-0.5 sm:mt-1 truncate">{periodLabels[periodFilter]}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <ArrowDownLeft className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate ml-1">Líquido</span>
          </div>
          <p className="text-sm sm:text-2xl font-bold text-foreground truncate">
            {formatCurrency(totalReceivedNet)}
          </p>
          <p className="text-[10px] sm:text-sm text-green-500 mt-0.5 sm:mt-1 truncate">{periodLabels[periodFilter]}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-4 h-4 sm:w-6 sm:h-6 text-red-500" />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate ml-1">Enviado</span>
          </div>
          <p className="text-sm sm:text-2xl font-bold text-foreground truncate">
            {formatCurrency(totalSent)}
          </p>
          <p className="text-[10px] sm:text-sm text-red-500 mt-0.5 sm:mt-1 truncate">{periodLabels[periodFilter]}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Key className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground">Chaves</span>
          </div>
          <p className="text-sm sm:text-2xl font-bold text-foreground">{pixKeys.length}</p>
          <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Chaves PIX</p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* API Key */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6"
        >
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
            Sua Chave API
          </h2>
          <div className="flex items-center gap-2 sm:gap-3 bg-secondary rounded-lg sm:rounded-xl p-3 sm:p-4">
            <code className="flex-1 text-xs sm:text-sm text-muted-foreground font-mono truncate">
              {profile?.api_key || "Carregando..."}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(profile?.api_key || "")}
              className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
            >
              <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3">
            Use esta chave para autenticar suas requisições à API. Mantenha-a em segredo!
          </p>
          <Link href="/docs">
            <Button variant="link" className="text-primary p-0 mt-2 text-xs sm:text-sm">
              Ver documentação da API
            </Button>
          </Link>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6"
        >
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-3">
            <Link href="/dashboard/wallet" className="block">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground justify-center lg:justify-start text-xs sm:text-sm h-9 sm:h-10">
                <ArrowDownLeft className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Depositar</span>
              </Button>
            </Link>
            <Link href="/dashboard/wallet" className="block">
              <Button variant="outline" className="w-full justify-center lg:justify-start text-xs sm:text-sm h-9 sm:h-10">
                <ArrowUpRight className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Sacar</span>
              </Button>
            </Link>
            <Link href="/dashboard/pix-keys" className="block">
              <Button variant="outline" className="w-full justify-center lg:justify-start text-xs sm:text-sm h-9 sm:h-10">
                <Key className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Gerenciar Chaves</span>
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Transações Recentes
          </h2>
          <Link href="/dashboard/transactions">
            <Button variant="ghost" className="text-primary text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4">
              Ver todas
            </Button>
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Nenhuma transação encontrada
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Suas transações aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 sm:p-4 bg-secondary/50 rounded-xl gap-3"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-background flex items-center justify-center flex-shrink-0">
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm sm:text-base truncate">
                      {getTypeLabel(transaction.type)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-semibold text-sm sm:text-base ${
                      isIncomingType(transaction.type)
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {isIncomingType(transaction.type) ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {getStatusIcon(transaction.status)}
                    <span className="text-xs text-muted-foreground capitalize hidden sm:inline">
                      {transaction.status === "completed" && "Concluido"}
                      {transaction.status === "pending" && "Pendente"}
                      {transaction.status === "processing" && "Processando"}
                      {transaction.status === "failed" && "Falhou"}
                      {transaction.status === "cancelled" && "Cancelado"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
