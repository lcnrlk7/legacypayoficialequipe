"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  X,
  CreditCard,
} from "lucide-react";

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  pix_key: string;
  pix_key_type: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  profiles: {
    email: string;
    name: string;
    balance: number;
  } | null;
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("pending");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadWithdrawals();
  }, []);

  useEffect(() => {
    let filtered = withdrawals;

    if (filter !== "all") {
      filtered = filtered.filter((w) => w.status === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (w) =>
          w.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.pix_key.includes(searchTerm)
      );
    }

    setFilteredWithdrawals(filtered);
  }, [searchTerm, filter, withdrawals]);

  async function loadWithdrawals() {
    try {
      const response = await fetch("/api/admin/withdrawals");
      const data = await response.json();

      if (data.withdrawals) {
        setWithdrawals(data.withdrawals);
        setFilteredWithdrawals(data.withdrawals.filter((w: Withdrawal) => w.status === "pending"));
      }
    } catch (error) {
      console.error("Error loading withdrawals:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const [isProcessing, setIsProcessing] = useState(false);

  async function approveWithdrawal(withdrawal: Withdrawal) {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Saque aprovado e enviado para processamento!");
        loadWithdrawals();
        setShowModal(false);
      } else {
        // Mostrar mensagem de erro detalhada
        if (data.insufficientBalance) {
          alert(`SALDO INSUFICIENTE NA ADQUIRENTE\n\n${data.error}\n\nVerifique o saldo da conta da adquirente (${data.acquirerName || "Medusa/MisticPay"}) antes de aprovar este saque.`);
        } else {
          alert(`Erro ao aprovar saque:\n\n${data.error || "Erro desconhecido"}`);
        }
      }
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      alert("Erro ao aprovar saque");
    } finally {
      setIsProcessing(false);
    }
  }

  async function markAsPaid(withdrawal: Withdrawal) {
    // Para saques que já foram aprovados manualmente, marcar como pago
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid" }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Saque marcado como pago!");
        loadWithdrawals();
        setShowModal(false);
      } else {
        alert(data.error || "Erro ao marcar como pago");
      }
    } catch (error) {
      console.error("Erro ao marcar como pago:", error);
      alert("Erro ao marcar como pago");
    } finally {
      setIsProcessing(false);
    }
  }

  async function rejectWithdrawal(withdrawal: Withdrawal) {
    if (!rejectionReason) {
      alert("Informe o motivo da rejeição");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectionReason }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Saque rejeitado. Saldo devolvido ao usuário.");
        loadWithdrawals();
        setShowModal(false);
        setRejectionReason("");
      } else {
        alert(data.error || "Erro ao rejeitar saque");
      }
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      alert("Erro ao rejeitar saque");
    } finally {
      setIsProcessing(false);
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

  const getPixKeyTypeLabel = (type: string) => {
    switch (type) {
      case "cpf":
        return "CPF";
      case "cnpj":
        return "CNPJ";
      case "email":
        return "E-mail";
      case "phone":
        return "Telefone";
      case "random":
        return "Chave Aleatória";
      default:
        return type;
    }
  };

  const totalPending = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((acc, w) => acc + w.amount, 0);

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
          <h1 className="text-2xl font-bold text-white mb-2">Saques</h1>
          <p className="text-muted-foreground">
            Gerencie as solicitações de saque
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
          >
            <option value="all" className="bg-card">
              Todos
            </option>
            <option value="pending" className="bg-card">
              Pendentes
            </option>
            <option value="approved" className="bg-card">
              Aprovados
            </option>
            <option value="paid" className="bg-card">
              Pagos
            </option>
            <option value="rejected" className="bg-card">
              Rejeitados
            </option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-400">
            {withdrawals.filter((w) => w.status === "pending").length}
          </p>
          <p className="text-sm text-muted-foreground">Pendentes</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(totalPending)}
          </p>
          <p className="text-sm text-muted-foreground">Total Pendente</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">
            {withdrawals.filter((w) => w.status === "paid").length}
          </p>
          <p className="text-sm text-muted-foreground">Pagos</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-red-400">
            {withdrawals.filter((w) => w.status === "rejected").length}
          </p>
          <p className="text-sm text-muted-foreground">Rejeitados</p>
        </div>
      </div>

      {/* Withdrawals List */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/5">
          {filteredWithdrawals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum saque encontrado
            </div>
          ) : (
            filteredWithdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="p-4 flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedWithdrawal(withdrawal);
                  setShowModal(true);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {withdrawal.profiles?.name || withdrawal.profiles?.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getPixKeyTypeLabel(withdrawal.pix_key_type)}:{" "}
                      {withdrawal.pix_key}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(withdrawal.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatCurrency(withdrawal.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Líquido: {formatCurrency(withdrawal.net_amount)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      withdrawal.status === "paid"
                        ? "bg-green-400/10 text-green-400"
                        : withdrawal.status === "pending"
                        ? "bg-yellow-400/10 text-yellow-400"
                        : withdrawal.status === "approved"
                        ? "bg-blue-400/10 text-blue-400"
                        : "bg-red-400/10 text-red-400"
                    }`}
                  >
                    {withdrawal.status === "paid"
                      ? "Pago"
                      : withdrawal.status === "pending"
                      ? "Pendente"
                      : withdrawal.status === "approved"
                      ? "Aprovado"
                      : "Rejeitado"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Detalhes do Saque
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary">
                <p className="text-sm text-muted-foreground mb-1">Valor</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(selectedWithdrawal.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Taxa: {formatCurrency(selectedWithdrawal.fee)} | Líquido:{" "}
                  {formatCurrency(selectedWithdrawal.net_amount)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Usuário</p>
                  <p className="text-white">
                    {selectedWithdrawal.profiles?.name || "Sem nome"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Saldo Atual
                  </p>
                  <p className="text-white">
                    {formatCurrency(selectedWithdrawal.profiles?.balance || 0)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Chave PIX</p>
                <div className="p-3 rounded-xl bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">
                    {getPixKeyTypeLabel(selectedWithdrawal.pix_key_type)}
                  </p>
                  <p className="text-white font-mono">
                    {selectedWithdrawal.pix_key}
                  </p>
                </div>
              </div>

              {selectedWithdrawal.status === "pending" && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Motivo da Rejeição (se aplicável)
                    </p>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Informe o motivo..."
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none h-20"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => rejectWithdrawal(selectedWithdrawal)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      {isProcessing ? "Processando..." : "Rejeitar"}
                    </button>
                    <button
                      onClick={() => approveWithdrawal(selectedWithdrawal)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-3 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {isProcessing ? "Processando..." : "Aprovar e Processar"}
                    </button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Saques acima de R$ 500,00 requerem aprovação manual
                  </p>
                </>
              )}

              {selectedWithdrawal.status === "approved" && (
                <button
                  onClick={() => markAsPaid(selectedWithdrawal)}
                  className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Marcar como Pago
                </button>
              )}

              {selectedWithdrawal.status === "rejected" &&
                selectedWithdrawal.rejection_reason && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400 font-medium mb-1">
                      Motivo da Rejeição:
                    </p>
                    <p className="text-red-300">
                      {selectedWithdrawal.rejection_reason}
                    </p>
                  </div>
                )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
