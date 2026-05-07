"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Plus,
  Edit,
  Power,
  PowerOff,
  X,
  Loader2,
  DollarSign,
  TrendingUp,
  Trash2,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  Shield,
  ArrowUpDown,
} from "lucide-react";

interface Acquirer {
  id: string;
  name: string;
  code: string;
  api_url: string;
  api_key: string;
  api_secret: string;
  is_active: boolean;
  priority: number;
  success_rate: number;
  total_transactions: number;
  total_volume: number;
  fee_percentage: number;
  withdrawal_fee: number;
  min_deposit: number;
  min_withdrawal: number;
  route_type: "white" | "black";
  min_amount: number;
  max_amount: number;
  created_at: string;
  // Novos campos para gestao inteligente
  health_status?: "online" | "degraded" | "offline";
  last_health_check?: string;
  avg_response_time?: number;
  failure_count_today?: number;
  is_fallback?: boolean;
}

interface RoutingConfig {
  auto_routing: boolean;
  routing_mode: "lowest_fee" | "highest_success" | "round_robin" | "priority";
  fallback_enabled: boolean;
  fallback_threshold: number; // % de falha para ativar fallback
  health_check_interval: number; // segundos
}

export default function AcquirersPage() {
  const [acquirers, setAcquirers] = useState<Acquirer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAcquirer, setEditingAcquirer] = useState<Acquirer | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<string | null>(null);
  const [routingConfig, setRoutingConfig] = useState<RoutingConfig>({
    auto_routing: true,
    routing_mode: "lowest_fee",
    fallback_enabled: true,
    fallback_threshold: 30,
    health_check_interval: 60,
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [addingVenopag, setAddingVenopag] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    api_url: "",
    api_key: "",
    api_secret: "",
    fee_percentage: 2.5,
    withdrawal_fee: 0,
    min_deposit: 1,
    min_withdrawal: 10,
    max_withdrawal: 10000,
    daily_limit: 10000,
    route_type: "white" as "white" | "black",
    priority: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAcquirers();
  }, []);

  async function loadAcquirers() {
    try {
      const response = await fetch("/api/admin/acquirers");
      const data = await response.json();
      if (data.acquirers) {
        setAcquirers(data.acquirers);
      }
      if (data.routingConfig) {
        setRoutingConfig(data.routingConfig);
      }
    } catch (error) {
      console.error("Error loading acquirers:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function checkHealth(acquirerId: string) {
    setCheckingHealth(acquirerId);
    try {
      const response = await fetch("/api/admin/acquirers/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acquirerId }),
      });
      const data = await response.json();
      if (data.success) {
        loadAcquirers();
      }
    } catch (error) {
      console.error("Error checking health:", error);
    } finally {
      setCheckingHealth(null);
    }
  }

  async function saveRoutingConfig() {
    setSavingConfig(true);
    try {
      await fetch("/api/admin/acquirers/routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routingConfig),
      });
    } catch (error) {
      console.error("Error saving routing config:", error);
    } finally {
      setSavingConfig(false);
    }
  }

  async function addVenopag() {
    setAddingVenopag(true);
    try {
      const response = await fetch("/api/admin/add-venopag");
      const data = await response.json();
      if (data.success) {
        alert("Venopag adicionada com sucesso!");
        loadAcquirers();
      } else {
        alert("Erro ao adicionar Venopag: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Error adding Venopag:", error);
      alert("Erro ao adicionar Venopag");
    } finally {
      setAddingVenopag(false);
    }
  }

  function getHealthIcon(status?: string) {
    switch (status) {
      case "online":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "offline":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  }

  function getHealthLabel(status?: string) {
    switch (status) {
      case "online":
        return "Online";
      case "degraded":
        return "Degradado";
      case "offline":
        return "Offline";
      default:
        return "Desconhecido";
    }
  }

  async function saveAcquirer() {
    setIsSaving(true);
    try {
      if (editingAcquirer) {
        await fetch("/api/admin/acquirers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingAcquirer.id,
            action: "update",
            data: {
              name: form.name,
              code: form.code,
              api_url: form.api_url,
              api_key: form.api_key,
              api_secret: form.api_secret,
              fee_percentage: form.fee_percentage,
              withdrawal_fee: form.withdrawal_fee,
              min_deposit: form.min_deposit,
              min_withdrawal: form.min_withdrawal,
              route_type: form.route_type,
              priority: form.priority,
            },
          }),
        });
      } else {
        await fetch("/api/admin/acquirers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      loadAcquirers();
      closeModal();
    } catch (error) {
      console.error("Error saving acquirer:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleAcquirer(acquirer: Acquirer) {
    try {
      await fetch("/api/admin/acquirers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: acquirer.id, action: "toggle" }),
      });
      loadAcquirers();
    } catch (error) {
      console.error("Error toggling acquirer:", error);
    }
  }

  async function deleteAcquirer(acquirer: Acquirer) {
    if (!confirm(`Tem certeza que deseja remover a adquirente "${acquirer.name}"?`)) {
      return;
    }
    try {
      await fetch("/api/admin/acquirers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: acquirer.id }),
      });
      loadAcquirers();
    } catch (error) {
      console.error("Error deleting acquirer:", error);
    }
  }

  function openAddModal() {
    setEditingAcquirer(null);
    setForm({
      name: "",
      code: "",
      api_url: "",
      api_key: "",
      api_secret: "",
      fee_percentage: 2.5,
      withdrawal_fee: 0,
      min_deposit: 1,
      min_withdrawal: 10,
      max_withdrawal: 10000,
      daily_limit: 10000,
      route_type: "white",
      priority: acquirers.length,
    });
    setShowModal(true);
  }

  function openEditModal(acquirer: Acquirer) {
    setEditingAcquirer(acquirer);
    setForm({
      name: acquirer.name,
      code: acquirer.code || "",
      api_url: acquirer.api_url,
      api_key: acquirer.api_key || "",
      api_secret: acquirer.api_secret || "",
      fee_percentage: acquirer.fee_percentage || 2.5,
      withdrawal_fee: acquirer.withdrawal_fee || 0,
      min_deposit: acquirer.min_deposit || 1,
      min_withdrawal: acquirer.min_withdrawal || 10,
      max_withdrawal: (acquirer as any).max_withdrawal || 10000,
      daily_limit: (acquirer as any).daily_limit || 10000,
      route_type: acquirer.route_type || "white",
      priority: acquirer.priority,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingAcquirer(null);
    setForm({
      name: "",
      code: "",
      api_url: "",
      api_key: "",
      api_secret: "",
      fee_percentage: 2.5,
      withdrawal_fee: 0,
      min_deposit: 1,
      min_withdrawal: 10,
      max_withdrawal: 10000,
      daily_limit: 10000,
      route_type: "white",
      priority: 0,
    });
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-secondary rounded-lg" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-secondary rounded-xl" />
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
          <h1 className="text-2xl font-bold text-white mb-2">Adquirentes</h1>
          <p className="text-muted-foreground">
            Gerencie os gateways de pagamento
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!acquirers.find(a => a.code === 'venopag') && (
            <button
              onClick={addVenopag}
              disabled={addingVenopag}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {addingVenopag ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Adicionar Venopag
            </button>
          )}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Adquirente
          </button>
        </div>
      </div>

      {/* Painel de Roteamento Inteligente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-primary/20"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Roteamento Inteligente</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Modo de Roteamento</label>
            <select
              value={routingConfig.routing_mode}
              onChange={(e) => setRoutingConfig({ ...routingConfig, routing_mode: e.target.value as RoutingConfig["routing_mode"] })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-white text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="lowest_fee">Menor Taxa</option>
              <option value="highest_success">Maior Sucesso</option>
              <option value="round_robin">Round Robin</option>
              <option value="priority">Por Prioridade</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Fallback Automatico</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRoutingConfig({ ...routingConfig, fallback_enabled: !routingConfig.fallback_enabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${routingConfig.fallback_enabled ? "bg-primary" : "bg-secondary"}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${routingConfig.fallback_enabled ? "left-7" : "left-1"}`} />
              </button>
              <span className="text-sm text-white">{routingConfig.fallback_enabled ? "Ativo" : "Inativo"}</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Limite Fallback (%)</label>
            <input
              type="number"
              value={routingConfig.fallback_threshold}
              onChange={(e) => setRoutingConfig({ ...routingConfig, fallback_threshold: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-white text-sm focus:outline-none focus:border-primary/50"
              min={0}
              max={100}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={saveRoutingConfig}
              disabled={savingConfig}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Salvar Config
            </button>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong className="text-white">Modo atual:</strong>{" "}
            {routingConfig.routing_mode === "lowest_fee" && "Roteando para adquirente com menor taxa"}
            {routingConfig.routing_mode === "highest_success" && "Roteando para adquirente com maior taxa de sucesso"}
            {routingConfig.routing_mode === "round_robin" && "Distribuindo transacoes igualmente entre adquirentes"}
            {routingConfig.routing_mode === "priority" && "Seguindo ordem de prioridade definida"}
            {routingConfig.fallback_enabled && ` | Fallback ativo se taxa de falha > ${routingConfig.fallback_threshold}%`}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{acquirers.length}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">
            {acquirers.filter((a) => a.is_active).length}
          </p>
          <p className="text-sm text-muted-foreground">Ativos</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-red-400">
            {acquirers.filter((a) => !a.is_active).length}
          </p>
          <p className="text-sm text-muted-foreground">Inativos</p>
        </div>
      </div>

      {/* Acquirers List */}
      <div className="space-y-4">
        {acquirers.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum adquirente cadastrado
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Adicionar primeiro adquirente
            </button>
          </div>
        ) : (
          acquirers.map((acquirer, index) => (
            <motion.div
              key={acquirer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass rounded-2xl p-6 ${
                !acquirer.is_active ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Server className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {acquirer.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          acquirer.is_active
                            ? "bg-green-400/10 text-green-400"
                            : "bg-red-400/10 text-red-400"
                        }`}
                      >
                        {acquirer.is_active ? "Ativo" : "Inativo"}
                      </span>
                      {/* Health Status */}
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        acquirer.health_status === "online" ? "bg-green-400/10 text-green-400" :
                        acquirer.health_status === "degraded" ? "bg-yellow-400/10 text-yellow-400" :
                        acquirer.health_status === "offline" ? "bg-red-400/10 text-red-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {getHealthIcon(acquirer.health_status)}
                        {getHealthLabel(acquirer.health_status)}
                      </span>
                      {acquirer.is_fallback && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-400/10 text-orange-400">
                          Fallback
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {acquirer.api_url}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Código: <span className="text-white font-mono">{acquirer.code}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        acquirer.route_type === "white" 
                          ? "bg-blue-500/10 text-blue-400" 
                          : "bg-purple-500/10 text-purple-400"
                      }`}>
                        {acquirer.route_type === "white" ? "WHITE" : "BLACK"}
                      </span>
                      <span className="text-muted-foreground">
                        Prioridade: <span className="text-white">{acquirer.priority}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Taxa Entrada: <span className="text-primary">{acquirer.fee_percentage || 2.5}%</span>
                      </span>
                      <span className="text-muted-foreground">
                        Taxa Saque: <span className="text-green-400">{Number(acquirer.withdrawal_fee || 0).toFixed(1)}%</span>
                      </span>
                      <span className="text-muted-foreground">
                        Min. Dep: <span className="text-white">R$ {Number(acquirer.min_deposit || 1).toFixed(2)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Min. Saque: <span className="text-white">R$ {Number(acquirer.min_withdrawal || 10).toFixed(2)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Max. Saque: <span className="text-yellow-400">R$ {Number((acquirer as any).max_withdrawal || 10000).toLocaleString('pt-BR')}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Limite Diario: <span className="text-yellow-400">R$ {Number((acquirer as any).daily_limit || 10000).toLocaleString('pt-BR')}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => checkHealth(acquirer.id)}
                    disabled={checkingHealth === acquirer.id}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary disabled:opacity-50"
                    title="Verificar Status"
                  >
                    {checkingHealth === acquirer.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleAcquirer(acquirer)}
                    className={`p-2 rounded-lg transition-colors ${
                      acquirer.is_active
                        ? "hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                        : "hover:bg-green-500/10 text-muted-foreground hover:text-green-400"
                    }`}
                    title={acquirer.is_active ? "Desativar" : "Ativar"}
                  >
                    {acquirer.is_active ? (
                      <PowerOff className="w-5 h-5" />
                    ) : (
                      <Power className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(acquirer)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-white"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteAcquirer(acquirer)}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                    title="Remover"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {editingAcquirer ? "Editar Adquirente" : "Novo Adquirente"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Nome
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: MisticPay"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Código (identificador único)
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                  placeholder="Ex: misticpay"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usado para identificar a adquirente no código. Apenas letras minúsculas, números e underscore.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  URL da API
                </label>
                <input
                  type="text"
                  value={form.api_url}
                  onChange={(e) => setForm({ ...form, api_url: e.target.value })}
                  placeholder="https://api.gateway.com"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  API Key
                </label>
                <input
                  type="text"
                  value={form.api_key}
                  onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                  placeholder="Chave da API"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  API Secret
                </label>
                <input
                  type="password"
                  value={form.api_secret}
                  onChange={(e) =>
                    setForm({ ...form, api_secret: e.target.value })
                  }
                  placeholder="Secret da API"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Tipo de Rota
                </label>
                <select
                  value={form.route_type}
                  onChange={(e) => setForm({ ...form, route_type: e.target.value as "white" | "black" })}
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
                >
                  <option value="white">WHITE - Gateway Premium</option>
                  <option value="black">BLACK - Gateway Express</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Taxa Entrada (%)
                  </label>
                  <input
                    type="number"
                    value={form.fee_percentage}
                    onChange={(e) =>
                      setForm({ ...form, fee_percentage: Number(e.target.value) })
                    }
                    placeholder="2.5"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Taxa Saque (%)
                  </label>
                  <input
                    type="number"
                    value={form.withdrawal_fee}
                    onChange={(e) =>
                      setForm({ ...form, withdrawal_fee: Number(e.target.value) })
                    }
                    placeholder="0"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Min. Deposito (R$)
                  </label>
                  <input
                    type="number"
                    value={form.min_deposit}
                    onChange={(e) =>
                      setForm({ ...form, min_deposit: Number(e.target.value) })
                    }
                    placeholder="1"
                    min="0"
                    step="1"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Min. Saque (R$)
                  </label>
                  <input
                    type="number"
                    value={form.min_withdrawal}
                    onChange={(e) =>
                      setForm({ ...form, min_withdrawal: Number(e.target.value) })
                    }
                    placeholder="10"
                    min="0"
                    step="1"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Limite por Saque (R$)
                  </label>
                  <input
                    type="number"
                    value={form.max_withdrawal}
                    onChange={(e) =>
                      setForm({ ...form, max_withdrawal: Number(e.target.value) })
                    }
                    placeholder="10000"
                    min="0"
                    step="100"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Limite Diario (R$)
                  </label>
                  <input
                    type="number"
                    value={form.daily_limit}
                    onChange={(e) =>
                      setForm({ ...form, daily_limit: Number(e.target.value) })
                    }
                    placeholder="10000"
                    min="0"
                    step="100"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Prioridade
                </label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: Number(e.target.value) })
                  }
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Menor número = maior prioridade
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-white hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveAcquirer}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
