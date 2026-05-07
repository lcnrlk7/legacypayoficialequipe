"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Lock,
  TrendingUp,
  TrendingDown,
  Receipt,
  ArrowUpRight,
  CheckCircle,
  DollarSign,
  Banknote,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Sparkline } from "@/components/ui/sparkline";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  fee?: number;
  net_amount?: number;
  status: string;
  created_at: string;
}

interface StatsCardsProps {
  balance: number;
  blockedBalance?: number;
  transactions: Transaction[];
  periodFilter: string;
  allTransactions?: Transaction[];
}

// Gera dados simulados para sparkline baseado no valor
const generateSparklineData = (value: number, trend: "up" | "down" | "stable" = "up"): number[] => {
  const points = 7;
  const data: number[] = [];
  const baseValue = value * 0.7;
  
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    let pointValue: number;
    
    if (trend === "up") {
      pointValue = baseValue + (value - baseValue) * progress + (Math.random() - 0.5) * value * 0.1;
    } else if (trend === "down") {
      pointValue = value - (value - baseValue) * progress + (Math.random() - 0.5) * value * 0.1;
    } else {
      pointValue = value * 0.9 + Math.random() * value * 0.2;
    }
    
    data.push(Math.max(0, pointValue));
  }
  
  return data;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function StatsCards({ 
  balance, 
  blockedBalance = 0, 
  transactions,
  periodFilter,
  allTransactions
}: StatsCardsProps) {
  const stats = useMemo(() => {
    const filteredTx = transactions;
    
    const depositTypes = ["deposit", "transfer_in", "pix_in", "received", "sale"];
    const withdrawalTypes = ["withdrawal", "transfer_out", "pix_out", "sent"];
    
    // BRUTO: Total de todas as transacoes (pendentes + processando + aprovadas)
    const allDeposits = filteredTx.filter(
      t => depositTypes.includes(t.type) && ["completed", "pending", "processing"].includes(t.status)
    );
    const valorBruto = allDeposits.reduce(
      (sum, t) => sum + (Number(t.amount) || 0), 0
    );
    
    // LIQUIDO: Apenas transacoes aprovadas/completadas
    const approvedDeposits = filteredTx.filter(
      t => depositTypes.includes(t.type) && t.status === "completed"
    );
    const valorLiquido = approvedDeposits.reduce(
      (sum, t) => sum + (Number(t.amount) || 0), 0
    );
    
    // Saques completados
    const completedWithdrawals = filteredTx.filter(
      t => withdrawalTypes.includes(t.type) && t.status === "completed"
    );

    // Calcular crescimento comparando com periodo anterior
    const txForComparison = allTransactions || transactions;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Transacoes aprovadas do mes anterior
    const lastMonthApproved = txForComparison.filter(t => {
      const date = new Date(t.created_at);
      const isLastMonth = (
        (date.getMonth() === currentMonth - 1 && date.getFullYear() === currentYear) ||
        (currentMonth === 0 && date.getMonth() === 11 && date.getFullYear() === currentYear - 1)
      );
      return isLastMonth && 
        depositTypes.includes(t.type) && 
        t.status === "completed";
    });
    
    const lastMonthVolume = lastMonthApproved.reduce(
      (sum, t) => sum + (Number(t.amount) || 0), 0
    );
    
    const volumeGrowth = lastMonthVolume > 0 
      ? ((valorLiquido - lastMonthVolume) / lastMonthVolume) * 100 
      : valorLiquido > 0 ? 100 : 0;

    // Ticket medio (baseado em aprovadas)
    const ticketMedio = approvedDeposits.length > 0 
      ? valorLiquido / approvedDeposits.length 
      : 0;

    // Total de transacoes (todas)
    const totalTransacoes = allDeposits.length;

    // Descontos em taxas (total de fees das aprovadas)
    const descontosTaxas = approvedDeposits.reduce(
      (sum, t) => sum + (Number(t.fee) || 0), 0
    );

    // Total retirado
    const totalRetirado = completedWithdrawals.reduce((sum, t) => {
      const netValue = t.net_amount !== undefined 
        ? Number(t.net_amount) 
        : (Number(t.amount) || 0) - (Number(t.fee) || 0);
      return sum + (netValue || 0);
    }, 0);

    // Conversao PIX (aprovados / total)
    const pixTotal = allDeposits.length;
    const pixApproved = approvedDeposits.length;
    const pixConversion = pixTotal > 0 
      ? (pixApproved / pixTotal) * 100 
      : 0;

    return {
      valorBruto,
      valorLiquido,
      volumeGrowth,
      ticketMedio,
      totalTransacoes,
      descontosTaxas,
      totalRetirado,
      pixConversion,
      pixApproved,
      pixTotal,
    };
  }, [transactions, allTransactions]);

  const cards = [
    {
      label: "Saldo Disponivel",
      rawValue: balance,
      isCurrency: true,
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
      sparklineColor: "#f97316",
      sparklineData: generateSparklineData(balance, "up"),
      subtitle: "Disponivel para saque",
      subtitleColor: "text-green-500",
    },
    {
      label: "Saldo Bloqueado",
      rawValue: blockedBalance,
      isCurrency: true,
      icon: Lock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      sparklineColor: "#eab308",
      sparklineData: generateSparklineData(blockedBalance, "stable"),
      subtitle: "Em processamento",
      subtitleColor: "text-yellow-500",
    },
    {
      label: "Valor Bruto",
      rawValue: stats.valorBruto,
      isCurrency: true,
      icon: DollarSign,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      sparklineColor: "#3b82f6",
      sparklineData: generateSparklineData(stats.valorBruto, "up"),
      subtitle: "Total de transacoes",
      subtitleColor: "text-muted-foreground",
    },
    {
      label: "Valor Liquido",
      rawValue: stats.valorLiquido,
      isCurrency: true,
      icon: stats.volumeGrowth >= 0 ? TrendingUp : TrendingDown,
      color: stats.volumeGrowth >= 0 ? "text-green-500" : "text-red-500",
      bgColor: stats.volumeGrowth >= 0 ? "bg-green-500/10" : "bg-red-500/10",
      sparklineColor: stats.volumeGrowth >= 0 ? "#22c55e" : "#ef4444",
      sparklineData: generateSparklineData(stats.valorLiquido, stats.volumeGrowth >= 0 ? "up" : "down"),
      subtitle: `${stats.volumeGrowth >= 0 ? "+" : ""}${stats.volumeGrowth.toFixed(1)}% vs mes anterior`,
      subtitleColor: stats.volumeGrowth >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      label: "Ticket Medio",
      rawValue: stats.ticketMedio,
      isCurrency: true,
      icon: Receipt,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      sparklineColor: "#06b6d4",
      sparklineData: generateSparklineData(stats.ticketMedio, "stable"),
      subtitle: "Por transacao aprovada",
      subtitleColor: "text-muted-foreground",
    },
    {
      label: "Total de Transacoes",
      rawValue: stats.totalTransacoes,
      isCurrency: false,
      icon: Banknote,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      sparklineColor: "#a855f7",
      sparklineData: generateSparklineData(stats.totalTransacoes, "up"),
      subtitle: periodFilter,
      subtitleColor: "text-muted-foreground",
    },
    {
      label: "Total Retirado",
      rawValue: stats.totalRetirado,
      isCurrency: true,
      icon: ArrowUpRight,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      sparklineColor: "#ef4444",
      sparklineData: generateSparklineData(stats.totalRetirado, "up"),
      subtitle: "Saques realizados",
      subtitleColor: "text-red-500",
    },
    {
      label: "Conversao PIX",
      rawValue: stats.pixConversion,
      isCurrency: false,
      suffix: "%",
      decimals: 1,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      sparklineColor: "#22c55e",
      sparklineData: generateSparklineData(stats.pixConversion, "up"),
      subtitle: `${stats.pixApproved}/${stats.pixTotal} aprovados`,
      subtitleColor: "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group relative bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-5 overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Glow effect */}
          <div className={`absolute -top-20 -right-20 w-40 h-40 ${card.bgColor} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-300`} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${card.bgColor} flex items-center justify-center ring-1 ring-white/10 shadow-lg`}>
                <card.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.color}`} />
              </div>
              {/* Sparkline */}
              <div className="hidden sm:block">
                <Sparkline 
                  data={card.sparklineData} 
                  color={card.sparklineColor}
                  width={60}
                  height={28}
                  strokeWidth={2}
                />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5 truncate uppercase tracking-wider">
              {card.label}
            </p>
            <div className="text-lg sm:text-2xl font-bold text-foreground truncate">
              {card.isCurrency ? (
                <AnimatedCounter 
                  value={card.rawValue} 
                  formatAsCurrency 
                  duration={1.2}
                />
              ) : (
                <AnimatedCounter 
                  value={card.rawValue} 
                  suffix={card.suffix || ""} 
                  decimals={card.decimals || 0}
                  duration={1.2}
                />
              )}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-[10px] sm:text-xs font-medium truncate ${card.subtitleColor}`}>
                {card.subtitle}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
