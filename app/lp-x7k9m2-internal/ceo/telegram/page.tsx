"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Bot, 
  Users, 
  Activity, 
  Send, 
  Settings, 
  RefreshCw,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  XCircle,
  ExternalLink,
  Trash2,
  Megaphone,
  Hash,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Link,
  Unlink,
  Eye,
  Clock,
  Bell,
  Zap,
  DollarSign,
  Percent,
  AlertTriangle,
  Webhook,
  Copy,
  Check,
  Search,
  Filter,
  Download
} from "lucide-react";

interface TelegramUser {
  id: string;
  user_id: string;
  telegram_id: string;
  telegram_username: string | null;
  telegram_first_name: string | null;
  is_active: boolean;
  created_at: string;
  name: string | null;
  email: string;
  balance: number;
}

interface TelegramLog {
  id: string;
  telegram_id: string;
  user_id: string | null;
  action: string;
  command: string | null;
  data: Record<string, unknown>;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  telegram_username: string | null;
}

interface TelegramTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

interface TelegramStats {
  total_users: number;
  actions_today: number;
  deposits_today: number;
  withdrawals_today: number;
  active_users_today: number;
  total_deposits: number;
  total_withdrawals: number;
  total_deposit_amount: number;
  total_withdrawal_amount: number;
  total_fees: number;
  deposit_amount_today: number;
  withdrawal_amount_today: number;
  fees_today: number;
}

interface TelegramSettings {
  id: string;
  bot_enabled: boolean;
  sales_channel_id: string | null;
  announcements_channel_id: string | null;
  notify_deposits: boolean;
  notify_withdrawals: boolean;
}

interface WebhookInfo {
  url: string;
  pending_count: number;
  last_error: string | null;
  last_error_date: number | null;
}

interface PendingWithdrawal {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  pix_key: string;
  status: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

type TabType = "overview" | "users" | "transactions" | "logs" | "announce" | "settings";

export default function TelegramPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [logs, setLogs] = useState<TelegramLog[]>([]);
  const [transactions, setTransactions] = useState<TelegramTransaction[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [stats, setStats] = useState<TelegramStats | null>(null);
  const [settings, setSettings] = useState<TelegramSettings | null>(null);
  const [webhook, setWebhook] = useState<WebhookInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/telegram/logs?limit=100");
      const data = await res.json();
      
      if (data.success) {
        setLogs(data.logs || []);
        setStats(data.stats || null);
        setUsers(data.users || []);
        setTransactions(data.transactions || []);
        setPendingWithdrawals(data.pending_withdrawals || []);
        setSettings(data.settings || null);
        setWebhook(data.webhook || null);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function sendAnnouncement() {
    if (!announcement.trim()) return;
    
    setSending(true);
    try {
      const res = await fetch("/api/telegram/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: announcement }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert("Aviso enviado com sucesso!");
        setAnnouncement("");
      } else {
        alert("Erro ao enviar: " + data.error);
      }
    } catch {
      alert("Erro ao enviar aviso");
    }
    setSending(false);
  }

  async function toggleBot() {
    try {
      const res = await fetch("/api/telegram/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_enabled: !settings?.bot_enabled }),
      });
      
      if (res.ok) {
        loadData();
      }
    } catch {
      alert("Erro ao alterar configuracao");
    }
  }

  async function unlinkUser(id: string) {
    if (!confirm("Tem certeza que deseja desvincular este usuario?")) return;
    
    try {
      const res = await fetch(`/api/telegram/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
      }
    } catch {
      alert("Erro ao desvincular usuario");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getActionIcon(action: string) {
    switch (action) {
      case "START":
      case "start": return <Bot className="w-4 h-4 text-blue-400" />;
      case "BALANCE":
      case "saldo": return <Wallet className="w-4 h-4 text-green-400" />;
      case "DEPOSIT_GENERATED":
      case "deposit": return <ArrowDownCircle className="w-4 h-4 text-green-400" />;
      case "WITHDRAWAL_COMPLETED":
      case "withdrawal": return <ArrowUpCircle className="w-4 h-4 text-orange-400" />;
      case "USER_LINKED":
      case "link_account": return <Link className="w-4 h-4 text-purple-400" />;
      case "unlink_account": return <Unlink className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  }

  function getActionLabel(action: string) {
    const labels: Record<string, string> = {
      START: "Iniciou bot",
      start: "Iniciou bot",
      BALANCE: "Consultou saldo",
      saldo: "Consultou saldo",
      DEPOSIT_GENERATED: "Gerou PIX deposito",
      deposit: "Solicitou deposito",
      WITHDRAWAL_COMPLETED: "Sacou",
      withdrawal: "Solicitou saque",
      EXTRATO: "Viu extrato",
      extrato: "Viu extrato",
      TAXAS: "Viu taxas",
      taxas: "Viu taxas",
      AJUDA: "Pediu ajuda",
      ajuda: "Pediu ajuda",
      USER_LINKED: "Vinculou conta",
      link_account: "Vinculou conta",
      unlink_account: "Desvinculou conta",
      MENU: "Abriu menu",
    };
    return labels[action] || action;
  }

  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      completed: "bg-green-500/20 text-green-400 border-green-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      failed: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    const labels: Record<string, string> = {
      completed: "Concluido",
      pending: "Pendente",
      processing: "Processando",
      failed: "Falhou",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  }

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.telegram_username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = logs.filter(l =>
    l.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados do Telegram...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Telegram Bot</h1>
              <p className="text-muted-foreground">Gerencie o bot, usuarios, transacoes e envie avisos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
              settings?.bot_enabled 
                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}>
              {settings?.bot_enabled ? (
                <><CheckCircle className="w-4 h-4" /> Bot Online</>
              ) : (
                <><XCircle className="w-4 h-4" /> Bot Offline</>
              )}
            </div>
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4 overflow-x-auto">
        {[
          { id: "overview", label: "Visao Geral", icon: TrendingUp },
          { id: "users", label: "Usuarios", icon: Users },
          { id: "transactions", label: "Transacoes", icon: DollarSign },
          { id: "logs", label: "Logs", icon: Activity },
          { id: "announce", label: "Enviar Aviso", icon: Megaphone },
          { id: "settings", label: "Configuracoes", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: VISAO GERAL */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Webhook Status */}
          {webhook && (
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              webhook.last_error 
                ? "bg-red-500/10 border-red-500/30" 
                : "bg-green-500/10 border-green-500/30"
            }`}>
              <div className="flex items-center gap-3">
                <Webhook className={`w-5 h-5 ${webhook.last_error ? "text-red-400" : "text-green-400"}`} />
                <div>
                  <p className="font-medium text-foreground">
                    Webhook: {webhook.last_error ? "Com erro" : "Funcionando"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {webhook.url || "Nao configurado"} | {webhook.pending_count} pendentes
                  </p>
                  {webhook.last_error && (
                    <p className="text-sm text-red-400 mt-1">Erro: {webhook.last_error}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(webhook.url || "")}
                className="p-2 rounded-lg bg-card border border-border hover:bg-muted"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Stats Cards - Usuarios */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">{stats?.total_users || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Usuarios Vinculados</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-400" />
                </div>
                <Clock className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">{stats?.active_users_today || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Ativos Hoje</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">{stats?.actions_today || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Comandos Hoje</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats?.deposits_today || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Depositos Hoje</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <ArrowUpCircle className="w-5 h-5 text-orange-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats?.withdrawals_today || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Saques Hoje</p>
            </div>
          </div>

          {/* Stats Cards - Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Depositos Hoje</p>
                  <p className="text-xl font-bold text-green-400">R$ {formatCurrency(Number(stats?.deposit_amount_today || 0))}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Total: R$ {formatCurrency(Number(stats?.total_deposit_amount || 0))}
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <ArrowUpCircle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saques Hoje</p>
                  <p className="text-xl font-bold text-orange-400">R$ {formatCurrency(Number(stats?.withdrawal_amount_today || 0))}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Total: R$ {formatCurrency(Number(stats?.total_withdrawal_amount || 0))}
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Percent className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxas Hoje</p>
                  <p className="text-xl font-bold text-purple-400">R$ {formatCurrency(Number(stats?.fees_today || 0))}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Total: R$ {formatCurrency(Number(stats?.total_fees || 0))}
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saques Pendentes</p>
                  <p className="text-xl font-bold text-yellow-400">{pendingWithdrawals.length}</p>
                </div>
              </div>
              {pendingWithdrawals.length > 0 && (
                <button 
                  onClick={() => setActiveTab("transactions")}
                  className="text-sm text-primary hover:underline"
                >
                  Ver pendentes
                </button>
              )}
            </div>
          </div>

          {/* Taxas Info */}
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-purple-400" />
              Taxas do Bot Telegram (Medusa Black)
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Deposito PIX</p>
                <p className="text-2xl font-bold text-green-400">5%</p>
                <p className="text-xs text-muted-foreground">Taxa sobre o valor depositado</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saque PIX</p>
                <p className="text-2xl font-bold text-orange-400">R$ 7,00</p>
                <p className="text-xs text-muted-foreground">Taxa fixa por saque</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="https://t.me/Legacypay_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card border border-border rounded-2xl p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Bot Principal</h3>
              <p className="text-sm text-muted-foreground">@Legacypay_bot</p>
            </a>

            <a
              href="https://t.me/legacypaybot"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card border border-border rounded-2xl p-5 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-green-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Canal de Vendas</h3>
              <p className="text-sm text-muted-foreground">@legacypaybot</p>
            </a>

            <a
              href="https://t.me/legacypayavisos"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card border border-border rounded-2xl p-5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-purple-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Canal de Avisos</h3>
              <p className="text-sm text-muted-foreground">@legacypayavisos</p>
            </a>

            <a
              href="https://discord.gg/ea32hgRSeM"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card border border-border rounded-2xl p-5 hover:border-[#5865F2]/50 hover:shadow-lg hover:shadow-[#5865F2]/10 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-[#5865F2] flex items-center justify-center">
                  <Hash className="w-6 h-6 text-white" />
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-[#5865F2] transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Discord</h3>
              <p className="text-sm text-muted-foreground">Suporte da comunidade</p>
            </a>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Atividade Recente</h3>
              </div>
              <button
                onClick={() => setActiveTab("logs")}
                className="text-sm text-primary hover:underline"
              >
                Ver todos
              </button>
            </div>
            <div className="divide-y divide-border">
              {logs.slice(0, 8).map((log) => (
                <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {log.user_name || log.telegram_username || `Telegram ID: ${log.telegram_id}`}
                    </p>
                    <p className="text-sm text-muted-foreground">{getActionLabel(log.action)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="p-10 text-center text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma atividade registrada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: USUARIOS */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou @username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Usuarios Vinculados</h3>
                <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                  {filteredUsers.length}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Telegram</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Saldo</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Vinculado em</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{user.name || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.telegram_username ? `@${user.telegram_username}` : user.telegram_first_name || "Sem username"}
                            </p>
                            <p className="text-xs text-muted-foreground">ID: {user.telegram_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-green-400">R$ {formatCurrency(Number(user.balance))}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => unlinkUser(user.id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Desvincular"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhum usuario encontrado</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TRANSACOES */}
      {activeTab === "transactions" && (
        <div className="space-y-6">
          {/* Pending Withdrawals */}
          {pendingWithdrawals.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-yellow-500/30 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold text-foreground">Saques Pendentes</h3>
                <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium">
                  {pendingWithdrawals.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-yellow-500/5">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Valor</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Chave PIX</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-500/20">
                    {pendingWithdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-yellow-500/5 transition-colors">
                        <td className="p-4">
                          <p className="font-medium text-foreground">{w.user_name}</p>
                          <p className="text-sm text-muted-foreground">{w.user_email}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-foreground">R$ {formatCurrency(Number(w.amount))}</p>
                          <p className="text-xs text-muted-foreground">Liquido: R$ {formatCurrency(Number(w.net_amount))}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-muted-foreground font-mono">{w.pix_key}</p>
                        </td>
                        <td className="p-4">{getStatusBadge(w.status)}</td>
                        <td className="p-4">
                          <p className="text-sm text-muted-foreground">
                            {new Date(w.created_at).toLocaleString("pt-BR")}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Transactions */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Transacoes via Telegram</h3>
                <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                  {transactions.length}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Valor</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Taxa</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            t.type === "pix" ? "bg-green-500/20" : "bg-orange-500/20"
                          }`}>
                            {t.type === "pix" ? (
                              <ArrowDownCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <ArrowUpCircle className="w-4 h-4 text-orange-400" />
                            )}
                          </div>
                          <span className="font-medium text-foreground">
                            {t.type === "pix" ? "Deposito" : "Saque"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">{t.user_name || "Sem nome"}</p>
                        <p className="text-sm text-muted-foreground">{t.user_email}</p>
                      </td>
                      <td className="p-4">
                        <p className={`font-medium ${t.type === "pix" ? "text-green-400" : "text-orange-400"}`}>
                          R$ {formatCurrency(Number(t.amount))}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-muted-foreground">R$ {formatCurrency(Number(t.fee))}</p>
                      </td>
                      <td className="p-4">{getStatusBadge(t.status)}</td>
                      <td className="p-4">
                        <p className="text-sm text-muted-foreground">
                          {new Date(t.created_at).toLocaleString("pt-BR")}
                        </p>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-muted-foreground">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhuma transacao via Telegram</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou acao..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Logs de Atividade</h3>
                <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                  {filteredLogs.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {log.user_name || log.telegram_username || `Telegram ID: ${log.telegram_id}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getActionLabel(log.action)}
                      {log.command && <span className="text-primary ml-2">/{log.command}</span>}
                    </p>
                    {log.data && Object.keys(log.data).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {JSON.stringify(log.data).substring(0, 80)}...
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleTimeString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="p-10 text-center text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum log encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: ENVIAR AVISO */}
      {activeTab === "announce" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">Enviar Aviso</h3>
                <p className="text-muted-foreground">Envie uma mensagem para o canal @legacypayavisos</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Mensagem</label>
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="Digite sua mensagem... (suporta HTML: <b>negrito</b>, <i>italico</i>, <code>codigo</code>)"
                  className="w-full h-48 p-4 bg-background border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {announcement.length} caracteres
                </p>
                <button
                  onClick={sendAnnouncement}
                  disabled={sending || !announcement.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Enviar Aviso</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h4 className="font-medium text-foreground mb-4">Templates Rapidos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  title: "Manutencao",
                  text: "🔧 <b>MANUTENCAO PROGRAMADA</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nTeremos uma breve manutencao hoje.\n\n⏰ Inicio: 23:00\n⏰ Previsao de retorno: 00:30\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                },
                {
                  title: "Novidade",
                  text: "🎉 <b>NOVIDADE!</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAcabamos de lancar uma nova funcionalidade!\n\nAcesse o painel para conferir.\n\n🌐 https://www.legacypay.site\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                },
                {
                  title: "Promocao",
                  text: "🔥 <b>PROMOCAO!</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nTaxas especiais por tempo limitado!\n\nAproveite agora.\n\n📱 @Legacypay_bot\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                },
                {
                  title: "Sistema OK",
                  text: "✅ <b>SISTEMA NORMALIZADO</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nTodos os servicos estao funcionando normalmente.\n\nObrigado pela paciencia!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                },
              ].map((template) => (
                <button
                  key={template.title}
                  onClick={() => setAnnouncement(template.text)}
                  className="text-left p-4 bg-muted/50 border border-border rounded-xl hover:bg-muted transition-colors"
                >
                  <p className="font-medium text-foreground">{template.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {template.text.replace(/<[^>]*>/g, "").substring(0, 60)}...
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: CONFIGURACOES */}
      {activeTab === "settings" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">Configuracoes do Bot</h3>
                <p className="text-muted-foreground">Gerencie as configuracoes do bot Telegram</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Bot Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <p className="font-medium text-foreground">Status do Bot</p>
                  <p className="text-sm text-muted-foreground">Ativar ou desativar o bot</p>
                </div>
                <button
                  onClick={toggleBot}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    settings?.bot_enabled
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  }`}
                >
                  {settings?.bot_enabled ? "Ativo" : "Inativo"}
                </button>
              </div>

              {/* Channels */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Canal de Vendas</label>
                  <input
                    type="text"
                    value={settings?.sales_channel_id || "@legacypaybot"}
                    readOnly
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Depositos, saques e novos usuarios</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Canal de Avisos</label>
                  <input
                    type="text"
                    value={settings?.announcements_channel_id || "@legacypayavisos"}
                    readOnly
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Comunicados e novidades</p>
                </div>
              </div>

              {/* Fees Info */}
              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
                <h4 className="font-medium text-foreground mb-3">Taxas do Bot (Medusa Black)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Deposito PIX</p>
                    <p className="text-lg font-bold text-green-400">5%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saque PIX</p>
                    <p className="text-lg font-bold text-orange-400">R$ 7,00</p>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="space-y-3">
                <a
                  href="https://t.me/Legacypay_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-blue-400" />
                    <span className="text-foreground">Acessar Bot</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
                <a
                  href="https://t.me/legacypaybot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-foreground">Canal de Vendas</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
                <a
                  href="https://t.me/legacypayavisos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-purple-400" />
                    <span className="text-foreground">Canal de Avisos</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
