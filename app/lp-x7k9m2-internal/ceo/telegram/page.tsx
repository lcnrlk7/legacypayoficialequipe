"use client";

import { useState, useEffect } from "react";
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
  User,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Link,
  Unlink,
  Eye,
  Clock,
  Bell,
  Zap
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

interface TelegramStats {
  total_users: number;
  actions_today: number;
  deposits_today: number;
  withdrawals_today: number;
  active_users_today: number;
}

interface TelegramSettings {
  id: string;
  bot_enabled: boolean;
  sales_channel_id: string | null;
  announcements_channel_id: string | null;
  notify_deposits: boolean;
  notify_withdrawals: boolean;
}

export default function TelegramPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "logs" | "announce" | "settings">("overview");
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [logs, setLogs] = useState<TelegramLog[]>([]);
  const [stats, setStats] = useState<TelegramStats | null>(null);
  const [settings, setSettings] = useState<TelegramSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [logsRes, settingsRes] = await Promise.all([
        fetch("/api/telegram/logs"),
        fetch("/api/telegram/settings"),
      ]);
      
      const logsData = await logsRes.json();
      const settingsData = await settingsRes.json();
      
      if (logsData.success) {
        setLogs(logsData.logs || []);
        setStats(logsData.stats || null);
        setUsers(logsData.users || []);
      }
      
      if (settingsData.success) {
        setSettings(settingsData.settings);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setLoading(false);
  }

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

  function getActionIcon(action: string) {
    switch (action) {
      case "start": return <Bot className="w-4 h-4 text-blue-400" />;
      case "saldo": return <Wallet className="w-4 h-4 text-green-400" />;
      case "deposit": return <ArrowDownCircle className="w-4 h-4 text-green-400" />;
      case "withdrawal": return <ArrowUpCircle className="w-4 h-4 text-orange-400" />;
      case "link_account": return <Link className="w-4 h-4 text-purple-400" />;
      case "unlink_account": return <Unlink className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  }

  function getActionLabel(action: string) {
    const labels: Record<string, string> = {
      start: "Iniciou bot",
      saldo: "Consultou saldo",
      deposit: "Solicitou deposito",
      withdrawal: "Solicitou saque",
      extrato: "Viu extrato",
      taxas: "Viu taxas",
      ajuda: "Pediu ajuda",
      link_account: "Vinculou conta",
      unlink_account: "Desvinculou conta",
    };
    return labels[action] || action;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("pt-BR");
  }

  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
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
              <p className="text-muted-foreground">Gerencie o bot, usuarios e envie avisos</p>
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
          { id: "logs", label: "Logs", icon: Activity },
          { id: "announce", label: "Enviar Aviso", icon: Megaphone },
          { id: "settings", label: "Configuracoes", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
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

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: VISAO GERAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
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

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: USUARIOS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "users" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Usuarios Vinculados</h3>
              <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                {users.length}
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
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{user.name || "Sem nome"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.telegram_username ? `@${user.telegram_username}` : user.telegram_first_name || "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground">ID: {user.telegram_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-green-400">
                        R$ {formatCurrency(Number(user.balance))}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => unlinkUser(user.id)}
                          className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Desvincular"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Nenhum usuario vinculado</p>
                      <p className="text-sm">Os usuarios podem vincular usando /start no bot</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: LOGS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "logs" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Logs de Atividade</h3>
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-sm">
              Ultimos 50
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data/Hora</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Acao</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Comando</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {log.user_name || log.telegram_username || "Desconhecido"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.user_email || `Telegram: ${log.telegram_id}`}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-foreground">{getActionLabel(log.action)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {log.command && (
                        <code className="px-2.5 py-1 rounded-lg bg-muted text-sm text-muted-foreground font-mono">
                          /{log.command}
                        </code>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Nenhum log registrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: ENVIAR AVISO */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "announce" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Megaphone className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Enviar Aviso</h3>
                <p className="text-muted-foreground">Envie uma mensagem para o canal @legacypayavisos</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Mensagem</label>
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder={"Digite sua mensagem aqui...\n\nVoce pode usar formatacao HTML:\n<b>Negrito</b>\n<i>Italico</i>\n<code>Codigo</code>"}
                  className="w-full h-52 px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none font-mono text-sm"
                />
              </div>

              <div className="bg-muted/50 rounded-xl p-5 border border-border">
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Pre-visualizacao
                </h4>
                <div 
                  className="text-foreground whitespace-pre-wrap bg-background rounded-lg p-4 border border-border min-h-[80px]"
                  dangerouslySetInnerHTML={{ 
                    __html: announcement || '<span class="text-muted-foreground italic">Sua mensagem aparecera aqui...</span>' 
                  }}
                />
              </div>

              <button
                onClick={sendAnnouncement}
                disabled={sending || !announcement.trim()}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                {sending ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {sending ? "Enviando..." : "Enviar Aviso"}
              </button>
            </div>
          </div>

          {/* Templates */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Templates Rapidos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  title: "Manutencao Programada",
                  icon: "⚠️",
                  color: "from-yellow-500/10 to-orange-500/10 border-yellow-500/20",
                  text: "⚠️ <b>AVISO DE MANUTENCAO</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nO sistema estara em manutencao das 00h as 02h.\n\nPedimos desculpas pelo inconveniente.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                },
                {
                  title: "Nova Funcionalidade",
                  icon: "🎉",
                  color: "from-green-500/10 to-emerald-500/10 border-green-500/20",
                  text: "🎉 <b>NOVIDADE!</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAcabamos de lancar uma nova funcionalidade!\n\nAcesse o painel para conferir.\n\n🌐 https://www.legacypay.site\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                },
                {
                  title: "Promocao Especial",
                  icon: "🔥",
                  color: "from-red-500/10 to-orange-500/10 border-red-500/20",
                  text: "🔥 <b>PROMOCAO ESPECIAL!</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAproveite taxas reduzidas por tempo limitado!\n\n✅ Depositos com taxa 0%\n✅ Saques mais baratos\n\nCorra, por tempo limitado!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                },
                {
                  title: "Sistema Normalizado",
                  icon: "✅",
                  color: "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
                  text: "✅ <b>SISTEMA NORMALIZADO</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nNosso sistema foi normalizado e todas as operacoes estao funcionando normalmente.\n\nObrigado pela paciencia!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                },
              ].map((template) => (
                <button
                  key={template.title}
                  onClick={() => setAnnouncement(template.text)}
                  className={`p-4 rounded-xl bg-gradient-to-br ${template.color} border hover:scale-[1.02] transition-all text-left`}
                >
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <span>{template.icon}</span>
                    {template.title}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {template.text.replace(/<[^>]*>/g, "").substring(0, 60)}...
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: CONFIGURACOES */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Configuracoes do Bot</h3>
            </div>
            
            <div className="space-y-6">
              {/* Bot Status */}
              <div className="flex items-center justify-between p-5 rounded-xl bg-muted/50 border border-border">
                <div>
                  <p className="font-medium text-foreground">Status do Bot</p>
                  <p className="text-sm text-muted-foreground">Ativar ou desativar o bot do Telegram</p>
                </div>
                <button
                  onClick={toggleBot}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings?.bot_enabled ? "bg-green-500" : "bg-muted"
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                    settings?.bot_enabled ? "left-7" : "left-1"
                  }`} />
                </button>
              </div>

              {/* Channel IDs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Canal de Vendas</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings?.sales_channel_id || "@legacypaybot"}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground"
                    />
                    <a
                      href="https://t.me/legacypaybot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Canal de Avisos</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings?.announcements_channel_id || "@legacypayavisos"}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground"
                    />
                    <a
                      href="https://t.me/legacypayavisos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="pt-6 border-t border-border">
                <h4 className="font-medium text-foreground mb-4">Links de Suporte Configurados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="https://discord.gg/ea32hgRSeM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/30 hover:border-[#5865F2]/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#5865F2] flex items-center justify-center">
                      <Hash className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Discord</p>
                      <p className="text-sm text-muted-foreground">discord.gg/ea32hgRSeM</p>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/5534999353187"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 hover:border-[#25D366]/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#25D366] flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">(34) 99935-3187</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Bot Username */}
              <div className="pt-6 border-t border-border">
                <div className="flex items-center gap-4 p-5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">@Legacypay_bot</p>
                    <p className="text-sm text-muted-foreground">Bot oficial do LegacyPay</p>
                  </div>
                  <a
                    href="https://t.me/Legacypay_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto p-3 rounded-xl bg-blue-500 text-white hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
