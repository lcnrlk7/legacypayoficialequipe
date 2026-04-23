"use client";

import { motion } from "framer-motion";
import {
  Users,
  ArrowUpDown,
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  user_email?: string;
  user_name?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  balance: number;
  created_at: string;
  is_admin: boolean;
}

interface AdminDashboardContentProps {
  usersCount: number;
  transactionsCount: number;
  recentTransactions: Transaction[];
  recentUsers: User[];
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
  }).format(new Date(date));
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "pending":
    case "processing":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    default:
      return <XCircle className="w-4 h-4 text-red-500" />;
  }
};

export function AdminDashboardContent({
  usersCount,
  transactionsCount,
  recentTransactions,
  recentUsers,
}: AdminDashboardContentProps) {
  const totalVolume = recentTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do sistema LegacyPay
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{usersCount}</p>
          <p className="text-sm text-muted-foreground mt-1">Usuários</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <ArrowUpDown className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {transactionsCount}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Transações</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(totalVolume)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Volume Total</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">99.9%</p>
          <p className="text-sm text-muted-foreground mt-1">Uptime</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Transações Recentes
          </h2>

          {recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transação encontrada
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        ["deposit", "transfer_in"].includes(transaction.type)
                          ? "bg-green-500/10"
                          : "bg-red-500/10"
                      }`}
                    >
                      {["deposit", "transfer_in"].includes(transaction.type) ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {transaction.user_email || "Usuário"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        ["deposit", "transfer_in"].includes(transaction.type)
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {formatCurrency(transaction.amount)}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      {getStatusIcon(transaction.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Novos Usuários
          </h2>

          {recentUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum usuário encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold">
                        {(user.name || user.email)[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {user.name || "Sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(user.balance)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
