"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Users,
  Activity,
  RefreshCw,
  Calendar,
  Target,
  Percent,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinancialData {
  overview: {
    totalVolume: number;
    totalFees: number;
    totalTransactions: number;
    grossProfit: number;
    totalAcquirerCosts: number;
  };
  thisMonth: {
    volume: number;
    fees: number;
    count: number;
    profit: number;
    acquirerCosts: number;
    projectedProfit: number;
  };
  lastMonth: {
    volume: number;
    fees: number;
    count: number;
    profit: number;
  };
  comparison: {
    monthOverMonth: number;
    volumeGrowth: number;
  };
  today: {
    volume: number;
    fees: number;
    count: number;
  };
  thisWeek: {
    volume: number;
    fees: number;
    count: number;
  };
  withdrawals: {
    total: number;
    fees: number;
    thisMonth: number;
    thisMonthFees: number;
  };
  metrics: {
    avgTicket: number;
    conversionRate: number;
    activeUsers: number;
    newUsers: number;
  };
  dailyVolume: Array<{
    date: string;
    volume: number;
    fees: number;
    count: number;
  }>;
}

export default function FinancialDashboard() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/financial");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Erro ao carregar dados</p>
        <Button onClick={loadData} className="mt-4">Tentar novamente</Button>
      </div>
    );
  }

  // Calcular max volume para o grafico
  const maxVolume = Math.max(...data.dailyVolume.map(d => d.volume), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visao geral do desempenho financeiro</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Lucro Real - Destaque */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold text-foreground">Lucro Real</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Lucro Bruto Total</p>
            <p className="text-3xl font-bold text-green-400">{formatCurrency(data.overview.grossProfit)}</p>
            <p className="text-xs text-muted-foreground mt-1">Taxas cobradas - custos</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lucro Este Mes</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(data.thisMonth.profit)}</p>
            <div className="flex items-center gap-1 mt-1">
              {data.comparison.monthOverMonth >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-400" />
              )}
              <span className={data.comparison.monthOverMonth >= 0 ? "text-green-400 text-sm" : "text-red-400 text-sm"}>
                {formatPercent(data.comparison.monthOverMonth)} vs mes anterior
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Projecao Mensal</p>
            <p className="text-3xl font-bold text-blue-400">{formatCurrency(data.thisMonth.projectedProfit)}</p>
            <p className="text-xs text-muted-foreground mt-1">Baseado nos dias passados</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Custo Adquirentes</p>
            <p className="text-3xl font-bold text-orange-400">{formatCurrency(data.overview.totalAcquirerCosts)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total pago aos gateways</p>
          </div>
        </div>
      </motion.div>

      {/* Cards de Metricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs">Hoje</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(data.today.volume)}</p>
          <p className="text-xs text-muted-foreground">{data.today.count} transacoes</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Esta Semana</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(data.thisWeek.volume)}</p>
          <p className="text-xs text-muted-foreground">{data.thisWeek.count} transacoes</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs">Ticket Medio</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(data.metrics.avgTicket)}</p>
          <p className="text-xs text-muted-foreground">Por transacao</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Percent className="w-4 h-4" />
            <span className="text-xs">Taxa de Conversao</span>
          </div>
          <p className="text-xl font-bold text-foreground">{data.metrics.conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">PIX gerado vs pago</p>
        </motion.div>
      </div>

      {/* Volume e Comparativo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Este Mes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Volume Este Mes</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Volume Processado</span>
              <span className="font-bold text-foreground">{formatCurrency(data.thisMonth.volume)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Taxas Cobradas</span>
              <span className="font-bold text-green-400">{formatCurrency(data.thisMonth.fees)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Custo Adquirentes</span>
              <span className="font-bold text-orange-400">-{formatCurrency(data.thisMonth.acquirerCosts)}</span>
            </div>
            <div className="border-t border-border pt-4 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Lucro Liquido</span>
              <span className="text-xl font-bold text-green-400">{formatCurrency(data.thisMonth.profit)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Transacoes</span>
              <span className="font-bold text-foreground">{formatNumber(data.thisMonth.count)}</span>
            </div>
          </div>
        </motion.div>

        {/* Comparativo Mes a Mes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Comparativo Mes a Mes</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Mes Passado</span>
                <span className="font-medium text-foreground">{formatCurrency(data.lastMonth.volume)}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full">
                <div 
                  className="h-full bg-muted-foreground/50 rounded-full"
                  style={{ width: `${Math.min((data.lastMonth.volume / Math.max(data.thisMonth.volume, data.lastMonth.volume)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Este Mes</span>
                <span className="font-medium text-foreground">{formatCurrency(data.thisMonth.volume)}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min((data.thisMonth.volume / Math.max(data.thisMonth.volume, data.lastMonth.volume)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                {data.comparison.volumeGrowth >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <span className={data.comparison.volumeGrowth >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {formatPercent(data.comparison.volumeGrowth)}
                </span>
                <span className="text-muted-foreground">crescimento em volume</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Saques e Usuarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Saques</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Total Sacado</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(data.withdrawals.total)}</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Taxas de Saque</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(data.withdrawals.fees)}</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Saques Este Mes</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(data.withdrawals.thisMonth)}</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Taxas Este Mes</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(data.withdrawals.thisMonthFees)}</p>
            </div>
          </div>
        </motion.div>

        {/* Usuarios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Usuarios</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Usuarios Ativos</p>
              <p className="text-xl font-bold text-foreground">{formatNumber(data.metrics.activeUsers)}</p>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Novos Usuarios</p>
              <p className="text-xl font-bold text-blue-400">{formatNumber(data.metrics.newUsers)}</p>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Grafico de Volume Diario */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Volume Diario (Ultimos 30 dias)</h3>
        </div>
        <div className="h-48 flex items-end gap-1">
          {data.dailyVolume.map((day, index) => (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center group relative"
            >
              <div
                className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors"
                style={{ height: `${(day.volume / maxVolume) * 100}%`, minHeight: "4px" }}
              />
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-popover border border-border rounded-lg p-2 text-xs whitespace-nowrap z-10 transition-opacity">
                <p className="font-medium">{new Date(day.date).toLocaleDateString("pt-BR")}</p>
                <p className="text-primary">{formatCurrency(day.volume)}</p>
                <p className="text-muted-foreground">{day.count} transacoes</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>30 dias atras</span>
          <span>Hoje</span>
        </div>
      </motion.div>

      {/* Totais Gerais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Totais Gerais (Historico Completo)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Volume Total</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(data.overview.totalVolume)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Taxas Totais</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(data.overview.totalFees)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Transacoes</p>
            <p className="text-xl font-bold text-foreground">{formatNumber(data.overview.totalTransactions)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lucro Bruto</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(data.overview.grossProfit)}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
