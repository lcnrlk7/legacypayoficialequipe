"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Lock,
  TrendingUp,
  TrendingDown,
  Receipt,
  Percent,
  ArrowUpRight,
  CheckCircle,
} from "lucide-react";

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
    // Usar transacoes filtradas pelo periodo
    const filteredTx = transactions;
    
    // Filtrar transacoes completadas
    const completedDeposits = filteredTx.filter(
      t => ["deposit", "transfer_in", "pix_in", "received"].includes(t.type) && t.status === "completed"
    );
    const completedWithdrawals = filteredTx.filter(
      t => ["withdrawal", "transfer_out", "pix_out", "sent"].includes(t.type) && t.status === "completed"
    );
    const allCompleted = filteredTx.filter(t => t.status === "completed");

    // Volume transacionado (total de entradas)
    const volumeTransacionado = completedDeposits.reduce(
      (sum, t) => sum + (Number(t.amount) || 0), 0
    );

    // Calcular crescimento comparando com periodo anterior
    // Usar allTransactions se disponivel para comparacao
    const txForComparison = allTransactions || transactions;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Transacoes do mes anterior
    const lastMonthDeposits = txForComparison.filter(t => {
      const date = new Date(t.created_at);
      const isLastMonth = (
        (date.getMonth() === currentMonth - 1 && date.getFullYear() === currentYear) ||
        (currentMonth === 0 && date.getMonth() === 11 && date.getFullYear() === currentYear - 1)
      );
      return isLastMonth && 
        ["deposit", "transfer_in", "pix_in", "received"].includes(t.type) && 
        t.status === "completed";
    });
    
    const lastMonthVolume = lastMonthDeposits.reduce(
      (sum, t) => sum + (Number(t.amount) || 0), 0
    );
    
    const volumeGrowth = lastMonthVolume > 0 
      ? ((volumeTransacionado - lastMonthVolume) / lastMonthVolume) * 100 
      : volumeTransacionado > 0 ? 100 : 0;

    // Ticket medio
    const ticketMedio = completedDeposits.length > 0 
      ? volumeTransacionado / completedDeposits.length 
      : 0;

    // Total de transacoes
    const totalTransacoes = allCompleted.length;

    // Descontos em taxas (total de fees)
    const descontosTaxas = completedDeposits.reduce(
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
    const pixTransactions = filteredTx.filter(
      t => ["deposit", "transfer_in", "pix_in", "received"].includes(t.type)
    );
    const pixApproved = pixTransactions.filter(t => t.status === "completed").length;
    const pixConversion = pixTransactions.length > 0 
      ? (pixApproved / pixTransactions.length) * 100 
      : 0;

    return {
      volumeTransacionado,
      volumeGrowth,
      ticketMedio,
      totalTransacoes,
      descontosTaxas,
      totalRetirado,
      pixConversion,
      pixApproved,
      pixTotal: pixTransactions.length,
    };
  }, [transactions, allTransactions]);

  const cards = [
    {
      label: "Saldo Disponivel",
      value: formatCurrency(balance),
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
      subtitle: "Disponivel para saque",
      subtitleColor: "text-green-500",
    },
    {
      label: "Saldo Bloqueado",
      value: formatCurrency(blockedBalance),
      icon: Lock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      subtitle: "Em processamento",
      subtitleColor: "text-yellow-500",
    },
    {
      label: "Volume Transacionado",
      value: formatCurrency(stats.volumeTransacionado),
      icon: stats.volumeGrowth >= 0 ? TrendingUp : TrendingDown,
      color: stats.volumeGrowth >= 0 ? "text-green-500" : "text-red-500",
      bgColor: stats.volumeGrowth >= 0 ? "bg-green-500/10" : "bg-red-500/10",
      subtitle: `${stats.volumeGrowth >= 0 ? "+" : ""}${stats.volumeGrowth.toFixed(1)}% vs mes anterior`,
      subtitleColor: stats.volumeGrowth >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      label: "Ticket Medio",
      value: formatCurrency(stats.ticketMedio),
      icon: Receipt,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      subtitle: "Por transacao",
      subtitleColor: "text-muted-foreground",
    },
    {
      label: "Total de Transacoes",
      value: stats.totalTransacoes.toString(),
      icon: Receipt,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      subtitle: periodFilter,
      subtitleColor: "text-muted-foreground",
    },
    {
      label: "Descontos em Taxas",
      value: formatCurrency(stats.descontosTaxas),
      icon: Percent,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      subtitle: "Total de taxas pagas",
      subtitleColor: "text-muted-foreground",
    },
    {
      label: "Total Retirado",
      value: formatCurrency(stats.totalRetirado),
      icon: ArrowUpRight,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      subtitle: "Saques realizados",
      subtitleColor: "text-red-500",
    },
    {
      label: "Conversao PIX",
      value: `${stats.pixConversion.toFixed(1)}%`,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
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
          className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-5"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${card.bgColor} flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">
            {card.label}
          </p>
          <p className={`text-sm sm:text-xl font-bold ${card.color} truncate`}>
            {card.value}
          </p>
          <p className={`text-[9px] sm:text-xs mt-1 truncate ${card.subtitleColor}`}>
            {card.subtitle}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
