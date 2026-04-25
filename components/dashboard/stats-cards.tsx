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
  DollarSign,
  Banknote,
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
      label: "Valor Bruto",
      value: formatCurrency(stats.valorBruto),
      icon: DollarSign,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      subtitle: "Total de transacoes",
      subtitleColor: "text-muted-foreground",
    },
    {
      label: "Valor Liquido",
      value: formatCurrency(stats.valorLiquido),
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
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      subtitle: "Por transacao aprovada",
      subtitleColor: "text-muted-foreground",
    },
    {
      label: "Total de Transacoes",
      value: stats.totalTransacoes.toString(),
      icon: Banknote,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      subtitle: periodFilter,
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
