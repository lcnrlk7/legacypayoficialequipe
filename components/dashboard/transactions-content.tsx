"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Search,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  fee: number;
  status: string;
  created_at: string;
  description: string | null;
  pix_key: string | null;
}

interface TransactionsContentProps {
  transactions: Transaction[];
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "pending":
    case "processing":
      return <Clock className="w-5 h-5 text-yellow-500" />;
    case "failed":
    case "cancelled":
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-muted-foreground" />;
  }
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

const isIncoming = (type: string) => {
  return type === "deposit" || type === "pix_in" || type === "transfer_in";
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Concluído";
    case "pending":
      return "Pendente";
    case "processing":
      return "Processando";
    case "failed":
      return "Falhou";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
};

export function TransactionsContent({ transactions }: TransactionsContentProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.pix_key?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = !filter || 
      (filter === "deposit" && (t.type === "deposit" || t.type === "pix_in")) ||
      (filter === "withdrawal" && (t.type === "withdrawal" || t.type === "pix_out")) ||
      t.type === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Transações
        </h1>
        <p className="text-muted-foreground mt-1">
          Histórico completo de suas transações
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, chave PIX..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={filter === null ? "default" : "outline"}
            onClick={() => setFilter(null)}
            className={`flex-shrink-0 text-xs sm:text-sm ${filter === null ? "bg-primary text-primary-foreground" : ""}`}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={filter === "deposit" ? "default" : "outline"}
            onClick={() => setFilter("deposit")}
            className={`flex-shrink-0 text-xs sm:text-sm ${filter === "deposit" ? "bg-primary text-primary-foreground" : ""}`}
            size="sm"
          >
            Depositos
          </Button>
          <Button
            variant={filter === "withdrawal" ? "default" : "outline"}
            onClick={() => setFilter("withdrawal")}
            className={`flex-shrink-0 text-xs sm:text-sm ${filter === "withdrawal" ? "bg-primary text-primary-foreground" : ""}`}
            size="sm"
          >
            Saques
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center"
        >
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-foreground font-medium">
            Nenhuma transacao encontrada
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || filter
              ? "Tente ajustar os filtros"
              : "Suas transacoes aparecerao aqui"}
          </p>
        </motion.div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="space-y-3 md:hidden">
            {filteredTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isIncoming(transaction.type)
                          ? "bg-green-500/10"
                          : "bg-red-500/10"
                      }`}
                    >
                      {isIncoming(transaction.type) ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-500" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {getTypeLabel(transaction.type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-semibold text-sm ${
                        isIncoming(transaction.type)
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {isIncoming(transaction.type) ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      {getStatusIcon(transaction.status)}
                      <span className="text-xs text-muted-foreground">
                        {getStatusLabel(transaction.status)}
                      </span>
                    </div>
                  </div>
                </div>
                {transaction.fee > 0 && (
                  <div className="mt-2 pt-2 border-t border-border flex justify-between text-xs text-muted-foreground">
                    <span>Taxa</span>
                    <span>{formatCurrency(transaction.fee)}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Desktop Table View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl overflow-hidden hidden md:block"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      Tipo
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      Valor
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      Taxa
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      Status
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isIncoming(transaction.type)
                                ? "bg-green-500/10"
                                : "bg-red-500/10"
                            }`}
                          >
                            {isIncoming(transaction.type) ? (
                              <ArrowDownLeft className="w-5 h-5 text-green-500" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {getTypeLabel(transaction.type)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold ${
                            isIncoming(transaction.type)
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {isIncoming(transaction.type)
                            ? "+"
                            : "-"}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatCurrency(transaction.fee || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <span className="text-sm">
                            {getStatusLabel(transaction.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {formatDate(transaction.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
