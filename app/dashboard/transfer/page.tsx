"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Search,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  RefreshCw,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FoundUser {
  id: string;
  name: string;
  email_masked: string;
  cpf_masked?: string;
  phone_masked?: string;
  avatar_url?: string;
}

interface Transfer {
  id: string;
  amount: number;
  fee: number;
  description: string;
  status: string;
  created_at: string;
  sender_name: string;
  sender_email: string;
  receiver_name: string;
  receiver_email: string;
  direction: "sent" | "received";
}

export default function TransferPage() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form
  const [identifier, setIdentifier] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  
  // Usuario encontrado
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Confirmacao
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Historico
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [totals, setTotals] = useState({ sent: 0, received: 0, count: 0 });
  
  // Resultado da transferencia
  const [transferResult, setTransferResult] = useState<{
    receiver_name: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    loadBalance();
    loadTransfers();
  }, []);

  const loadBalance = async () => {
    try {
      const res = await fetch("/api/user/balance");
      const data = await res.json();
      setBalance(data.balance || 0);
    } catch (err) {
      console.error("Erro ao carregar saldo:", err);
    }
  };

  const loadTransfers = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/transfers?limit=20");
      const data = await res.json();
      if (data.success) {
        setTransfers(data.transfers || []);
        setTotals(data.totals || { sent: 0, received: 0, count: 0 });
      }
    } catch (err) {
      console.error("Erro ao carregar historico:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const searchUser = async () => {
    if (!identifier || identifier.trim().length < 3) {
      setSearchError("Digite pelo menos 3 caracteres");
      return;
    }

    setSearching(true);
    setSearchError(null);
    setFoundUser(null);

    try {
      const res = await fetch(`/api/transfers/search?q=${encodeURIComponent(identifier.trim())}`);
      const data = await res.json();

      if (data.success && data.found) {
        setFoundUser(data.user);
      } else {
        setSearchError(data.message || "Usuario nao encontrado");
      }
    } catch (err) {
      setSearchError("Erro ao buscar usuario");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = () => {
    setError(null);

    if (!foundUser) {
      setError("Busque e selecione um destinatario");
      return;
    }

    const transferAmount = parseFloat(amount);
    if (!transferAmount || transferAmount <= 0) {
      setError("Digite um valor valido");
      return;
    }

    if (transferAmount < 1) {
      setError("Valor minimo: R$ 1,00");
      return;
    }

    if (transferAmount > balance) {
      setError("Saldo insuficiente");
      return;
    }

    setShowConfirm(true);
  };

  const confirmTransfer = async () => {
    if (!foundUser) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_identifier: identifier.trim(),
          amount: parseFloat(amount),
          description: description.trim() || "Transferencia interna",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao realizar transferencia");
      }

      setTransferResult({
        receiver_name: data.transfer.receiver_name,
        amount: data.transfer.amount,
      });
      setBalance(data.new_balance);
      setSuccess(true);
      setShowConfirm(false);
      
      // Limpar form
      setIdentifier("");
      setAmount("");
      setDescription("");
      setFoundUser(null);
      
      // Recarregar historico
      loadTransfers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao realizar transferencia";
      setError(errorMessage);
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resetForm = () => {
    setSuccess(false);
    setTransferResult(null);
    setError(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Transferir
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Envie dinheiro para outros usuarios LegacyPay sem taxas
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-green-500">Taxa Zero</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Transferencia */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            {/* Sucesso */}
            <AnimatePresence mode="wait">
              {success && transferResult ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Transferencia Realizada!
                  </h3>
                  <p className="text-muted-foreground mb-1">
                    Voce enviou {formatCurrency(transferResult.amount)} para
                  </p>
                  <p className="text-lg font-semibold text-foreground mb-6">
                    {transferResult.receiver_name}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-green-500 mb-6">
                    <Info className="w-4 h-4" />
                    <span>Sem cobranca de taxa</span>
                  </div>
                  <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
                    Nova Transferencia
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Saldo disponivel */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo Disponivel</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(balance)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={loadBalance}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Buscar destinatario */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <Label className="text-foreground mb-2 block">
                        Email do Destinatario
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="Digite o email do destinatario"
                          value={identifier}
                          onChange={(e) => {
                            setIdentifier(e.target.value);
                            setFoundUser(null);
                            setSearchError(null);
                          }}
                          onKeyDown={(e) => e.key === "Enter" && searchUser()}
                          className="flex-1"
                        />
                        <Button
                          onClick={searchUser}
                          disabled={searching || !identifier}
                          variant="outline"
                        >
                          {searching ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {searchError && (
                        <p className="text-red-500 text-sm mt-2">{searchError}</p>
                      )}
                    </div>

                    {/* Usuario encontrado */}
                    {foundUser && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-green-500/5 border border-green-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            {foundUser.avatar_url ? (
                              <img
                                src={foundUser.avatar_url}
                                alt={foundUser.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">
                              {foundUser.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {foundUser.email_masked}
                            </p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Valor */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <Label className="text-foreground mb-2 block">
                        Valor
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          R$
                        </span>
                        <Input
                          type="number"
                          placeholder="0,00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-10 text-lg"
                          min="1"
                          step="0.01"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Valor minimo: R$ 1,00
                      </p>
                    </div>

                    {/* Valores rapidos */}
                    <div className="flex flex-wrap gap-2">
                      {[10, 20, 50, 100, 200, 500].map((val) => (
                        <Button
                          key={val}
                          variant="outline"
                          size="sm"
                          onClick={() => setAmount(val.toString())}
                          disabled={val > balance}
                          className="text-xs"
                        >
                          R$ {val}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Descricao */}
                  <div className="mb-6">
                    <Label className="text-foreground mb-2 block">
                      Descricao (opcional)
                    </Label>
                    <Textarea
                      placeholder="Ex: Pagamento do almoco"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {description.length}/100
                    </p>
                  </div>

                  {/* Info taxa zero */}
                  <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <p className="text-sm text-green-600">
                        Transferencias internas sao gratuitas! Voce nao paga nenhuma taxa.
                      </p>
                    </div>
                  </div>

                  {/* Erro */}
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-6">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-500">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Botao */}
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !foundUser || !amount}
                    className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Transferir
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Resumo e Historico */}
        <div className="space-y-6">
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-red-400" />
                <span className="text-xs text-muted-foreground">Enviado</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(totals.sent)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownLeft className="w-4 h-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Recebido</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(totals.received)}
              </p>
            </motion.div>
          </div>

          {/* Historico */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                Historico
              </h3>
              <Button variant="ghost" size="sm" onClick={loadTransfers}>
                <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : transfers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Send className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma transferencia ainda</p>
                </div>
              ) : (
                transfers.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.direction === "sent" 
                            ? "bg-red-500/10" 
                            : "bg-green-500/10"
                        }`}>
                          {tx.direction === "sent" ? (
                            <ArrowUpRight className="w-4 h-4 text-red-400" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {tx.direction === "sent" 
                              ? tx.receiver_name 
                              : tx.sender_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx.direction === "sent" ? "Enviado" : "Recebido"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${
                          tx.direction === "sent" 
                            ? "text-foreground" 
                            : "text-green-400"
                        }`}>
                          {tx.direction === "sent" ? "-" : "+"}
                          {formatCurrency(tx.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    {tx.description && tx.description !== "Transferencia interna" && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {tx.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de Confirmacao */}
      <AnimatePresence>
        {showConfirm && foundUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  Confirmar Transferencia
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Destinatario</p>
                  <p className="font-semibold text-foreground">{foundUser.name}</p>
                  <p className="text-sm text-muted-foreground">{foundUser.email_masked}</p>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Valor</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(parseFloat(amount))}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-green-500 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Taxa: R$ 0,00</span>
                  </div>
                </div>

                {description && (
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Descricao</p>
                    <p className="text-foreground">{description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={confirmTransfer}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
