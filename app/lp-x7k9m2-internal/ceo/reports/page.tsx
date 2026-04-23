"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Users,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  type: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: string;
  description: string;
  created_at: string;
  payer_name?: string;
  external_id?: string;
}

interface ReportStats {
  total_transactions: number;
  total_volume: number;
  total_fees_collected: number;
  pending_count: number;
  completed_count: number;
  cancelled_count: number;
  users_count: number;
  today_volume: number;
  today_fees: number;
}

export default function AdminReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pix_in" | "pix_out" | "withdrawal">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "cancelled">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/reports");
      const data = await response.json();
      if (data.transactions) {
        setTransactions(data.transactions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pending: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-3 h-3" />, label: "Pendente" },
      processing: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <RefreshCw className="w-3 h-3 animate-spin" />, label: "Processando" },
      completed: { color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="w-3 h-3" />, label: "Aprovado" },
      cancelled: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-3 h-3" />, label: "Cancelado" },
      failed: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <AlertCircle className="w-3 h-3" />, label: "Falhou" },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const types: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pix_in: { color: "bg-green-500/10 text-green-400", icon: <ArrowDownLeft className="w-3 h-3" />, label: "PIX In" },
      pix_out: { color: "bg-orange-500/10 text-orange-400", icon: <ArrowUpRight className="w-3 h-3" />, label: "PIX Out" },
      withdrawal: { color: "bg-purple-500/10 text-purple-400", icon: <ArrowUpRight className="w-3 h-3" />, label: "Saque" },
      deposit: { color: "bg-blue-500/10 text-blue-400", icon: <ArrowDownLeft className="w-3 h-3" />, label: "Depósito" },
    };
    const typeInfo = types[type] || types.pix_in;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${typeInfo.color}`}>
        {typeInfo.icon}
        {typeInfo.label}
      </span>
    );
  };

  const filterByDate = (tx: Transaction) => {
    if (dateFilter === "all") return true;
    const txDate = new Date(tx.created_at);
    const now = new Date();
    if (dateFilter === "today") {
      return txDate.toDateString() === now.toDateString();
    }
    if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return txDate >= weekAgo;
    }
    if (dateFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return txDate >= monthAgo;
    }
    return true;
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter !== "all" && tx.type !== filter) return false;
    if (statusFilter !== "all" && tx.status !== statusFilter) return false;
    if (!filterByDate(tx)) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        tx.id.toLowerCase().includes(search) ||
        tx.user_email?.toLowerCase().includes(search) ||
        tx.user_name?.toLowerCase().includes(search) ||
        tx.description?.toLowerCase().includes(search) ||
        tx.external_id?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const filteredStats = {
    volume: filteredTransactions.filter(tx => tx.status === "completed").reduce((acc, tx) => acc + tx.amount, 0),
    fees: filteredTransactions.filter(tx => tx.status === "completed").reduce((acc, tx) => acc + tx.fee, 0),
    count: filteredTransactions.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios Gerais</h1>
          <p className="text-muted-foreground">Visão completa de todas as transações da plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadReports}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-[#111111] border border-border"
        >
          <div className="flex items-center gap-2 text-primary mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Volume Total</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(stats?.total_volume || 0)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20"
        >
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Taxas Coletadas</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(stats?.total_fees_collected || 0)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-[#111111] border border-border"
        >
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Aprovadas</span>
          </div>
          <p className="text-xl font-bold text-white">{stats?.completed_count || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-[#111111] border border-border"
        >
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pendentes</span>
          </div>
          <p className="text-xl font-bold text-white">{stats?.pending_count || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-2xl bg-[#111111] border border-border"
        >
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Usuários</span>
          </div>
          <p className="text-xl font-bold text-white">{stats?.users_count || 0}</p>
        </motion.div>
      </div>

      {/* Today Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <h3 className="text-sm font-medium text-primary mb-2">Hoje</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="text-lg font-bold text-white">{formatCurrency(stats?.today_volume || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Taxas</p>
              <p className="text-lg font-bold text-green-400">{formatCurrency(stats?.today_fees || 0)}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#111111] border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Filtro Atual</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Volume Filtrado</p>
              <p className="text-lg font-bold text-white">{formatCurrency(filteredStats.volume)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Taxas Filtradas</p>
              <p className="text-lg font-bold text-green-400">{formatCurrency(filteredStats.fees)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 rounded-2xl bg-[#111111] border border-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, usuário, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#1a1a1a] border-border"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
            className="px-4 py-2 rounded-xl bg-[#1a1a1a] border border-border text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="all">Todo período</option>
            <option value="today">Hoje</option>
            <option value="week">Última semana</option>
            <option value="month">Último mês</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 rounded-xl bg-[#1a1a1a] border border-border text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="all">Todos os tipos</option>
            <option value="pix_in">PIX Entrada</option>
            <option value="pix_out">PIX Saída</option>
            <option value="withdrawal">Saques</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2 rounded-xl bg-[#1a1a1a] border border-border text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="completed">Aprovados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-[#111111] border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuário</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tipo</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Taxa</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma transação encontrada</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 100).map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.01 }}
                    className="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-4">
                      <span className="text-sm text-foreground">{formatDate(tx.created_at)}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{tx.user_name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{tx.user_email}</p>
                      </div>
                    </td>
                    <td className="p-4">{getTypeBadge(tx.type)}</td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm text-green-400 font-medium">
                        +{formatCurrency(tx.fee || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-center">{getStatusBadge(tx.status)}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {Math.min(filteredTransactions.length, 100)} de {filteredTransactions.length} transações
          </p>
          <div className="text-sm font-medium text-green-400">
            Total Taxas: {formatCurrency(filteredStats.fees)}
          </div>
        </div>
      </div>
    </div>
  );
}
