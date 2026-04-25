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
  Filter,
  Download,
  Search,
  Calendar,
  TrendingUp,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: string;
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
  total_pix_in: number;
  total_pix_out: number;
  pending_count: number;
  completed_count: number;
  cancelled_count: number;
  total_fees: number;
  total_volume: number;
}

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pix_in" | "pix_out" | "withdrawal">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "cancelled">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const response = await fetch("/api/user/reports");
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
      pix_in: { color: "bg-green-500/10 text-green-400", icon: <ArrowDownLeft className="w-3 h-3" />, label: "PIX Entrada" },
      pix_out: { color: "bg-orange-500/10 text-orange-400", icon: <ArrowUpRight className="w-3 h-3" />, label: "PIX Saída" },
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

  const filteredTransactions = transactions.filter((tx) => {
    if (filter !== "all" && tx.type !== filter) return false;
    if (statusFilter !== "all" && tx.status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        tx.id.toLowerCase().includes(search) ||
        tx.description?.toLowerCase().includes(search) ||
        tx.payer_name?.toLowerCase().includes(search) ||
        tx.external_id?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus PIX, saques e transações</p>
        </div>
        <Button variant="outline" onClick={loadReports} size="sm" className="w-fit">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border"
        >
          <div className="flex items-center gap-1.5 text-green-400 mb-2">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Aprovados</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-foreground">{stats?.completed_count || 0}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
            {formatCurrency(stats?.total_volume || 0)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border"
        >
          <div className="flex items-center gap-1.5 text-red-400 mb-2">
            <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Cancelados</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-foreground">{stats?.cancelled_count || 0}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Total cancelados</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="space-y-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary border-border text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="all">Todos os tipos</option>
            <option value="pix_in">PIX Entrada</option>
            <option value="pix_out">PIX Saída</option>
            <option value="withdrawal">Saques</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="completed">Aprovados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="space-y-3 sm:hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-xl">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground">Nenhuma transação encontrada</p>
          </div>
        ) : (
          filteredTransactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="p-3 bg-card border border-border rounded-xl"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{formatDate(tx.created_at)}</span>
                </div>
                {getStatusBadge(tx.status)}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {getTypeBadge(tx.type)}
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {tx.description || "-"}
                  </p>
                  {tx.external_id && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      ID: {tx.external_id}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-sm font-semibold ${tx.type === "pix_in" || tx.type === "deposit" ? "text-green-400" : "text-foreground"}`}>
                    {tx.type === "pix_in" || tx.type === "deposit" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="rounded-xl sm:rounded-2xl bg-card border border-border overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Data</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Tipo</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Descrição</th>
                <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Valor</th>
                <th className="text-center p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma transação encontrada</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-3 sm:p-4">
                      <span className="text-xs sm:text-sm text-foreground">{formatDate(tx.created_at)}</span>
                    </td>
                    <td className="p-3 sm:p-4">{getTypeBadge(tx.type)}</td>
                    <td className="p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-foreground truncate max-w-[200px]">
                        {tx.description || "-"}
                      </p>
                      {tx.external_id && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          ID: {tx.external_id}
                        </p>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 text-right">
                      <span className={`text-xs sm:text-sm font-medium ${tx.type === "pix_in" || tx.type === "deposit" ? "text-green-400" : "text-foreground"}`}>
                        {tx.type === "pix_in" || tx.type === "deposit" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-center">{getStatusBadge(tx.status)}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 sm:p-4 border-t border-border">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Mostrando {filteredTransactions.length} de {transactions.length} transações
          </p>
        </div>
      </div>
    </div>
  );
}
