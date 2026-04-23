"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Banknote, 
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Copy,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  admin_notes: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_balance?: number;
}

export default function ManagerWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "processing" | "completed" | "rejected" | "all">("pending");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadWithdrawals();
  }, [filter]);

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const url = filter === "all" 
        ? "/api/admin/withdrawals"
        : `/api/admin/withdrawals?status=${filter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error("Error loading withdrawals:", error);
    }
    setLoading(false);
  };

  const handleApprove = async (withdrawal: Withdrawal) => {
    setProcessing(true);
    setActionError("");
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        setActionError(result.error || "Erro ao aprovar saque");
        return;
      }
      
      loadWithdrawals();
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error("Error approving:", error);
      setActionError("Erro de conexão ao aprovar saque");
    }
    setProcessing(false);
  };

  const handleMarkPaid = async (withdrawal: Withdrawal) => {
    setProcessing(true);
    setActionError("");
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_paid",
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        setActionError(result.error || "Erro ao marcar como pago");
        return;
      }
      
      loadWithdrawals();
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error("Error marking paid:", error);
      setActionError("Erro de conexão");
    }
    setProcessing(false);
  };

  const handleReject = async (withdrawal: Withdrawal) => {
    if (!rejectionReason.trim()) {
      setActionError("Informe o motivo da rejeição");
      return;
    }
    
    setProcessing(true);
    setActionError("");
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          reason: rejectionReason,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        setActionError(result.error || "Erro ao rejeitar saque");
        return;
      }
      
      loadWithdrawals();
      setSelectedWithdrawal(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting:", error);
      setActionError("Erro de conexão");
    }
    setProcessing(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filters = [
    { value: "pending", label: "Pendentes", color: "text-yellow-500" },
    { value: "processing", label: "Processando", color: "text-blue-500" },
    { value: "completed", label: "Pagos", color: "text-green-500" },
    { value: "rejected", label: "Rejeitados", color: "text-red-500" },
    { value: "all", label: "Todos", color: "text-foreground" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing": return "bg-blue-500/20 text-blue-500";
      case "approved": return "bg-blue-500/20 text-blue-500";
      case "completed": return "bg-green-500/20 text-green-500";
      case "rejected": return "bg-red-500/20 text-red-500";
      default: return "bg-yellow-500/20 text-yellow-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing": return RefreshCw;
      case "approved": return CheckCircle2;
      case "completed": return CheckCircle2;
      case "rejected": return XCircle;
      default: return Clock;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "processing": return "Processando";
      case "approved": return "Aprovado";
      case "completed": return "Pago";
      case "rejected": return "Rejeitado";
      default: return "Pendente";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Gerenciar Saques
          </h1>
          <p className="text-muted-foreground mt-1">
            Aprove e processe solicitações de saque automaticamente
          </p>
        </div>
        <Button onClick={loadWithdrawals} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value as typeof filter)}
            className={filter === f.value ? "" : f.color}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Withdrawals List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : withdrawals.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Banknote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum saque encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {withdrawals.map((withdrawal, index) => {
            const StatusIcon = getStatusIcon(withdrawal.status);
            return (
              <motion.div
                key={withdrawal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${getStatusColor(withdrawal.status).split(" ")[0]}`}>
                          <Banknote className={`w-6 h-6 ${getStatusColor(withdrawal.status).split(" ")[1]}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {withdrawal.user_name || withdrawal.user_email || "Usuário"}
                          </p>
                          <p className="text-lg font-bold text-primary">
                            R$ {Number(withdrawal.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Líquido: R$ {Number(withdrawal.net_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | {new Date(withdrawal.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(withdrawal.status)}`}>
                          <StatusIcon className={`w-4 h-4 ${withdrawal.status === "processing" ? "animate-spin" : ""}`} />
                          {getStatusLabel(withdrawal.status)}
                        </div>

                        {(withdrawal.status === "pending" || withdrawal.status === "processing") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setActionError("");
                              setRejectionReason("");
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {withdrawal.status === "pending" ? "Revisar" : "Processar"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {(withdrawal.rejection_reason || withdrawal.admin_notes) && (
                      <div className={`mt-4 p-3 rounded-lg ${withdrawal.rejection_reason ? "bg-red-500/10 border border-red-500/20" : "bg-muted"}`}>
                        <p className={`text-sm ${withdrawal.rejection_reason ? "text-red-500" : "text-muted-foreground"}`}>
                          <strong>{withdrawal.rejection_reason ? "Motivo:" : "Nota:"}</strong> {withdrawal.rejection_reason || withdrawal.admin_notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">
              {selectedWithdrawal.status === "pending" ? "Revisar Saque" : "Processar Pagamento"}
            </h2>

            {actionError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-500 text-sm">{actionError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted">
                <p className="text-sm text-muted-foreground">Usuário</p>
                <p className="font-medium text-foreground">
                  {selectedWithdrawal.user_name || selectedWithdrawal.user_email || "Usuário"}
                </p>
                {selectedWithdrawal.user_email && selectedWithdrawal.user_name && (
                  <p className="text-xs text-muted-foreground">{selectedWithdrawal.user_email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted">
                  <p className="text-sm text-muted-foreground">Valor Bruto</p>
                  <p className="font-bold text-foreground text-lg">
                    R$ {Number(selectedWithdrawal.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted">
                  <p className="text-sm text-muted-foreground">Taxa</p>
                  <p className="font-medium text-foreground">
                    R$ {Number(selectedWithdrawal.fee).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">Valor Líquido (a enviar)</p>
                <p className="font-bold text-primary text-xl">
                  R$ {Number(selectedWithdrawal.net_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Chave PIX ({selectedWithdrawal.pix_key_type || "Automático"})</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-foreground flex-1 text-sm break-all">{selectedWithdrawal.pix_key}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(selectedWithdrawal.pix_key)}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {selectedWithdrawal.status === "pending" && (
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">
                    Motivo da rejeição (obrigatório para rejeitar)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ex: Dados inconsistentes, KYC pendente, limite excedido..."
                    className="w-full h-24 p-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedWithdrawal(null);
                    setRejectionReason("");
                    setActionError("");
                  }}
                  disabled={processing}
                >
                  Cancelar
                </Button>

                {selectedWithdrawal.status === "pending" ? (
                  <>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleReject(selectedWithdrawal)}
                      disabled={processing || !rejectionReason.trim()}
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Rejeitar
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(selectedWithdrawal)}
                      disabled={processing}
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      Aprovar
                    </Button>
                  </>
                ) : (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleMarkPaid(selectedWithdrawal)}
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Marcar como Pago
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
