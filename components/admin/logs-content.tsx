"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ScrollText,
  ShoppingCart,
  CreditCard,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  DollarSign,
  Activity,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Log {
  id: string;
  type: string;
  action: string;
  title: string;
  description: string | null;
  user_id: string | null;
  amount: number | null;
  metadata: any;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
}

interface Stats {
  logs_24h: number;
  total_orders: number;
  total_paid: number;
  total_amount: number;
}

interface AdminLogsContentProps {
  logs: Log[];
  stats: Stats;
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
    second: "2-digit",
  }).format(new Date(date));
};

const getLogIcon = (type: string, action: string) => {
  switch (type) {
    case "checkout_order":
      return <ShoppingCart className="w-5 h-5 text-blue-500" />;
    case "pix_payment":
      if (action === "paid") return <CheckCircle className="w-5 h-5 text-green-500" />;
      if (action === "failed") return <XCircle className="w-5 h-5 text-red-500" />;
      return <CreditCard className="w-5 h-5 text-yellow-500" />;
    case "user_login":
      return <UserPlus className="w-5 h-5 text-purple-500" />;
    default:
      return <ScrollText className="w-5 h-5 text-muted-foreground" />;
  }
};

const getLogBgColor = (type: string, action: string) => {
  switch (type) {
    case "checkout_order":
      return "bg-blue-500/10";
    case "pix_payment":
      if (action === "paid") return "bg-green-500/10";
      if (action === "failed") return "bg-red-500/10";
      return "bg-yellow-500/10";
    case "user_login":
      return "bg-purple-500/10";
    default:
      return "bg-secondary";
  }
};

const getActionBadge = (action: string) => {
  switch (action) {
    case "created":
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-500 rounded-full">
          Criado
        </span>
      );
    case "paid":
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-500 rounded-full">
          Pago
        </span>
      );
    case "failed":
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-500 rounded-full">
          Falhou
        </span>
      );
    case "pending":
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/10 text-yellow-500 rounded-full">
          Pendente
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-secondary text-muted-foreground rounded-full">
          {action}
        </span>
      );
  }
};

export function AdminLogsContent({ logs, stats }: AdminLogsContentProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.title.toLowerCase().includes(search.toLowerCase()) ||
      log.description?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "all" || log.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Logs do Sistema
        </h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe todas as atividades em tempo real
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.logs_24h}</p>
          <p className="text-sm text-muted-foreground mt-1">Logs (24h)</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total_orders}</p>
          <p className="text-sm text-muted-foreground mt-1">Pedidos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total_paid}</p>
          <p className="text-sm text-muted-foreground mt-1">Pagos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(Number(stats.total_amount) || 0)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Total</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={typeFilter === "all" ? "default" : "outline"}
            onClick={() => setTypeFilter("all")}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={typeFilter === "checkout_order" ? "default" : "outline"}
            onClick={() => setTypeFilter("checkout_order")}
            size="sm"
          >
            Pedidos
          </Button>
          <Button
            variant={typeFilter === "pix_payment" ? "default" : "outline"}
            onClick={() => setTypeFilter("pix_payment")}
            size="sm"
          >
            Pagamentos
          </Button>
        </div>
      </div>

      {/* Logs List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum log encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getLogBgColor(
                      log.type,
                      log.action
                    )}`}
                  >
                    {getLogIcon(log.type, log.action)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{log.title}</p>
                        {log.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {log.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {log.amount && log.amount > 0 && (
                          <span className="font-semibold text-green-500">
                            {formatCurrency(log.amount)}
                          </span>
                        )}
                        {getActionBadge(log.action)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{formatDate(log.created_at)}</span>
                      {log.user_email && (
                        <span className="flex items-center gap-1">
                          <UserPlus className="w-3 h-3" />
                          {log.user_email}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 bg-secondary rounded text-[10px] uppercase tracking-wide">
                        {log.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
