"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  Loader2,
} from "lucide-react";
interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  fee: number;
  status: string;
  pix_key: string;
  description: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    let filtered = transactions;

    if (filter !== "all") {
      filtered = filtered.filter((t) => t.status === filter);
    }

    if (typeFilter !== "all") {
      if (typeFilter === "pix_in") {
        filtered = filtered.filter((t) => t.type === "pix_in" || t.type === "deposit");
      } else if (typeFilter === "pix_out") {
        filtered = filtered.filter((t) => t.type === "pix_out" || t.type === "withdrawal");
      } else {
        filtered = filtered.filter((t) => t.type === typeFilter);
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.includes(searchTerm)
      );
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, filter, typeFilter, transactions]);

  async function loadTransactions() {
    try {
      const response = await fetch("/api/admin/all-transactions");
      const data = await response.json();
      
      if (data.transactions) {
        setTransactions(data.transactions);
        setFilteredTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR");
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
        return "Recebimento";
      case "transfer_out":
        return "Transferência";
      default:
        return type;
    }
  };
  
  const isIncoming = (type: string) => {
    return type === "deposit" || type === "pix_in" || type === "transfer_in";
  };

  const totalVolume = transactions.reduce((acc, t) => acc + Number(t.amount), 0);
  const totalFees = transactions.reduce((acc, t) => acc + Number(t.fee || 0), 0);

  async function confirmTransaction(transactionId: string) {
    if (!confirm("Tem certeza que deseja confirmar esta transação? O saldo será creditado ao usuário.")) {
      return;
    }

    setConfirmingId(transactionId);
    try {
      const response = await fetch("/api/admin/transactions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Transação confirmada! Novo saldo do usuário: R$ ${data.user.newBalance.toFixed(2)}`);
        loadTransactions();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Error confirming transaction:", error);
      alert("Erro ao confirmar transação");
    } finally {
      setConfirmingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-secondary rounded-lg" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-secondary rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Transações</h1>
          <p className="text-muted-foreground">
            Monitore todas as transações do sistema
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-48"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
          >
            <option value="all" className="bg-card">
              Todos os tipos
            </option>
            <option value="pix_in" className="bg-card">
              Depósitos PIX
            </option>
            <option value="pix_out" className="bg-card">
              Saques PIX
            </option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
          >
            <option value="all" className="bg-card">
              Todos os status
            </option>
            <option value="completed" className="bg-card">
              Concluídos
            </option>
            <option value="pending" className="bg-card">
              Pendentes
            </option>
            <option value="failed" className="bg-card">
              Falhos
            </option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{transactions.length}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(totalVolume)}
          </p>
          <p className="text-sm text-muted-foreground">Volume Total</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(totalFees)}
          </p>
          <p className="text-sm text-muted-foreground">Taxas Coletadas</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-400">
            {transactions.filter((t) => t.status === "pending").length}
          </p>
          <p className="text-sm text-muted-foreground">Pendentes</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Tipo
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Usuário
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Valor
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Taxa
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Data
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-secondary transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
<div
                          className={`p-2 rounded-lg ${
                            isIncoming(transaction.type)
                              ? "bg-green-400/10"
                              : "bg-red-400/10"
                          }`}
                        >
                          {isIncoming(transaction.type) ? (
                            <ArrowDownRight className="w-4 h-4 text-green-400" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <span className="text-white">
                          {getTypeLabel(transaction.type)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white">
                        {transaction.user_name || "Sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.user_email}
                      </p>
                    </td>
                    <td className="p-4">
<p
                        className={`font-semibold ${
                          isIncoming(transaction.type)
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {isIncoming(transaction.type) ? "+" : "-"}
                        {formatCurrency(Number(transaction.amount))}
                      </p>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {formatCurrency(Number(transaction.fee || 0))}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === "completed"
                            ? "bg-green-400/10 text-green-400"
                            : transaction.status === "pending"
                            ? "bg-yellow-400/10 text-yellow-400"
                            : "bg-red-400/10 text-red-400"
                        }`}
                      >
                        {transaction.status === "completed"
                          ? "Concluído"
                          : transaction.status === "pending"
                          ? "Pendente"
                          : "Falhou"}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="p-4">
                      {transaction.status === "pending" && (
                        <button
                          onClick={() => confirmTransaction(transaction.id)}
                          disabled={confirmingId === transaction.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors text-sm disabled:opacity-50"
                        >
                          {confirmingId === transaction.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Confirmar
                        </button>
                      )}
                      {transaction.status === "completed" && (
                        <span className="text-xs text-muted-foreground">Confirmado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
