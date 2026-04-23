"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Trophy,
  Package,
  Clock,
  Truck,
  Loader2,
  Plus,
  X,
  Search,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Reward {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: "pending" | "credited" | "cancelled";
  credited_at: string | null;
  created_at: string;
  profiles: {
    name: string | null;
    email: string | null;
    balance: number | null;
  } | null;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  balance: number;
}

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    user_id: "",
    type: "Placa 100K",
    amount: "1000",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      
      // Busca premiações
      const rewardsRes = await fetch("/api/admin/rewards");
      const rewardsData = await rewardsRes.json();
      setRewards(rewardsData.rewards || []);

      // Busca usuários para o select
      const usersRes = await fetch("/api/admin/users");
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateReward() {
    if (!formData.user_id || !formData.type || !formData.amount) {
      alert("Preencha todos os campos");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: formData.user_id,
          type: formData.type,
          amount: parseFloat(formData.amount),
        }),
      });

      if (res.ok) {
        await loadData();
        closeModal();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao criar premiação");
      }
    } catch (error) {
      console.error("Error creating reward:", error);
      alert("Erro ao criar premiação");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateRewardStatus(id: string, status: string) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao atualizar");
      }
    } catch (error) {
      console.error("Error updating reward:", error);
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteReward(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta premiação?")) return;

    try {
      const res = await fetch(`/api/admin/rewards?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir");
      }
    } catch (error) {
      console.error("Error deleting reward:", error);
    }
  }

  function closeModal() {
    setShowModal(false);
    setFormData({
      user_id: "",
      type: "Placa 100K",
      amount: "1000",
    });
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredRewards = rewards.filter((r) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      r.profiles?.name?.toLowerCase().includes(searchLower) ||
      r.profiles?.email?.toLowerCase().includes(searchLower) ||
      r.type.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: rewards.length,
    pending: rewards.filter((r) => r.status === "pending").length,
    credited: rewards.filter((r) => r.status === "credited").length,
    cancelled: rewards.filter((r) => r.status === "cancelled").length,
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Sistema de Premiações
          </h1>
          <p className="text-muted-foreground">
            Gerencie premiações dos usuários
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Premiação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-400/10">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-400/10">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.credited}</p>
              <p className="text-sm text-muted-foreground">Creditadas</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-400/10">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
              <p className="text-sm text-muted-foreground">Canceladas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por usuário ou tipo..."
          className="bg-secondary pl-10"
        />
      </div>

      {/* Rewards List */}
      <div className="glass rounded-2xl overflow-hidden">
        {filteredRewards.length === 0 ? (
          <div className="p-12 text-center">
            <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma premiação encontrada</p>
            <p className="text-sm text-muted-foreground mt-2">
              Clique em "Nova Premiação" para criar
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredRewards.map((reward) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Gift className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {reward.profiles?.name || reward.profiles?.email || "Usuário"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reward.type} - {formatCurrency(reward.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(reward.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {updatingId === reward.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <select
                          value={reward.status}
                          onChange={(e) =>
                            updateRewardStatus(reward.id, e.target.value)
                          }
                          className={`text-xs px-3 py-1.5 rounded-full border-0 cursor-pointer ${
                            reward.status === "pending"
                              ? "bg-yellow-400/10 text-yellow-400"
                              : reward.status === "credited"
                              ? "bg-green-400/10 text-green-400"
                              : "bg-red-400/10 text-red-400"
                          }`}
                        >
                          <option value="pending">Pendente</option>
                          <option value="credited">Creditada</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReward(reward.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Nova Premiação
                </h3>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Usuário *
                  </label>
                  <select
                    value={formData.user_id}
                    onChange={(e) =>
                      setFormData({ ...formData, user_id: e.target.value })
                    }
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground"
                  >
                    <option value="">Selecione um usuário</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email} - {formatCurrency(user.balance || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Tipo de Premiação *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground"
                  >
                    <option value="Pulseira Inicial">Pulseira Inicial</option>
                    <option value="Placa 50K">Placa 50K</option>
                    <option value="Placa 100K">Placa 100K</option>
                    <option value="Placa 500K">Placa 500K</option>
                    <option value="Placa 1M">Placa 1M</option>
                    <option value="Placa 5M">Placa 5M</option>
                    <option value="Placa 10M">Placa 10M</option>
                    <option value="Bônus Especial">Bônus Especial</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Valor (R$) *
                  </label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="1000"
                    className="bg-secondary"
                  />
                </div>

                <Button
                  onClick={handleCreateReward}
                  disabled={isSaving}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar Premiação
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
