"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
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
  email?: string;
  name?: string | null;
}

interface AdminTransactionsContentProps {
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
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "pending":
    case "processing":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    default:
      return <XCircle className="w-4 h-4 text-red-500" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "pix_in":
    case "deposit":
      return "PIX Entrada";
    case "pix_out":
    case "withdrawal":
      return "PIX Saída";
    case "transfer_in":
      return "Recebido";
    case "transfer_out":
      return "Enviado";
    default:
      return type;
  }
};

export function AdminTransactionsContent({
  transactions,
}: AdminTransactionsContentProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = !filter || t.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Transações
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize todas as transações do sistema
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === null ? "default" : "outline"}
            onClick={() => setFilter(null)}
            className={
              filter === null ? "bg-primary text-primary-foreground" : ""
            }
          >
            Todos
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            onClick={() => setFilter("completed")}
            className={
              filter === "completed" ? "bg-primary text-primary-foreground" : ""
            }
          >
            Concluídos
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className={
              filter === "pending" ? "bg-primary text-primary-foreground" : ""
            }
          >
            Pendentes
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-12 text-center"
        >
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-medium">
            Nenhuma transação encontrada
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                    ID
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                    Usuário
                  </th>
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
                      <code className="text-xs text-muted-foreground font-mono">
                        {transaction.id.slice(0, 8)}...
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          {transaction.name || "Sem nome"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.email || "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {["deposit", "transfer_in", "pix_in"].includes(
                          transaction.type
                        ) ? (
                          <ArrowDownLeft className="w-4 h-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {getTypeLabel(transaction.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          ["deposit", "transfer_in", "pix_in"].includes(transaction.type)
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {formatCurrency(transaction.fee || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <span className="text-sm capitalize">
                          {transaction.status === "completed" && "Concluído"}
                          {transaction.status === "pending" && "Pendente"}
                          {transaction.status === "processing" && "Processando"}
                          {transaction.status === "failed" && "Falhou"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
