"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Users,
  ArrowUpRight,
  Loader2,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
} from "lucide-react";

interface UserFee {
  user_id: string;
  name: string;
  email: string;
  fee_percentage: number;
  route_type: string;
  total_fees_paid: number;
  total_transactions: number;
  total_volume: number;
  last_transaction_at: string | null;
}

interface FeesSummary {
  totalFeesCollected: number;
  totalVolume: number;
  totalTransactions: number;
  averageFeePercentage: number;
  activeUsersCount: number;
  totalUsersCount: number;
}

export default function AdminFeesPage() {
  const [users, setUsers] = useState<UserFee[]>([]);
  const [summary, setSummary] = useState<FeesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadFees = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const response = await fetch("/api/admin/fees");
      const data = await response.json();
      setUsers(data.users || []);
      setSummary(data.summary || null);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error loading fees:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadFees(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadFees]);

  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Taxas Coletadas</h1>
          <p className="text-muted-foreground">
            Receita gerada pelas taxas das transações aprovadas
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Indicador de última atualização */}
          {lastUpdate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {lastUpdate.toLocaleTimeString("pt-BR")}
            </div>
          )}
          
          {/* Toggle auto-refresh */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              autoRefresh 
                ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                : "bg-secondary text-muted-foreground border border-border"
            }`}
          >
            {autoRefresh ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Auto
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Manual
              </>
            )}
          </button>
          
          {/* Botão de atualização */}
          <button
            onClick={() => loadFees(false)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-green-500/20">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-green-400">Total em Taxas</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(summary?.totalFeesCollected || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Receita total da plataforma
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-blue-400">Volume Total</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(summary?.totalVolume || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Volume processado
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-purple-500/20">
              <ArrowUpRight className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-purple-400">Transações</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {summary?.totalTransactions || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Total de transações
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-orange-500/20">
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-sm text-orange-400">Taxa Média</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {(summary?.averageFeePercentage || 0).toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Percentual médio cobrado
          </p>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-secondary border border-border overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Usuário
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Taxa %
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                  Taxas Pagas
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                  Volume
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                  Transações
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                  Última Transação
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="w-12 h-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">Nenhuma taxa registrada ainda</p>
                      <p className="text-xs text-muted-foreground/70">
                        As taxas aparecerão aqui quando transações forem aprovadas
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    className="border-b border-border hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {(user.name || user.email || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {user.name || "Sem nome"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary text-sm font-medium">
                          {user.fee_percentage || 2.5}%
                        </span>
                        {user.route_type && (
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            user.route_type === 'black' 
                              ? 'bg-black text-white border border-white/20' 
                              : 'bg-white/10 text-white'
                          }`}>
                            {user.route_type === 'black' ? 'Black' : 'White'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-400 font-semibold text-lg">
                        {formatCurrency(user.total_fees_paid)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-white font-medium">
                      {formatCurrency(user.total_volume)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2 py-1 rounded-full bg-secondary text-white text-sm">
                        {user.total_transactions}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground text-sm">
                      {formatDate(user.last_transaction_at)}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer com totais */}
        <div className="px-6 py-4 bg-gradient-to-r from-green-500/5 to-blue-500/5 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {filteredUsers.length} usuário(s) com transações
              </span>
              {summary && (
                <span className="text-xs text-muted-foreground">
                  de {summary.totalUsersCount} total
                </span>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Total Taxas (filtrado)</p>
                <p className="text-green-400 font-bold text-lg">
                  {formatCurrency(
                    filteredUsers.reduce((acc, u) => acc + u.total_fees_paid, 0)
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Total Volume (filtrado)</p>
                <p className="text-white font-bold text-lg">
                  {formatCurrency(
                    filteredUsers.reduce((acc, u) => acc + u.total_volume, 0)
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Total Transações</p>
                <p className="text-white font-bold text-lg">
                  {filteredUsers.reduce((acc, u) => acc + u.total_transactions, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
