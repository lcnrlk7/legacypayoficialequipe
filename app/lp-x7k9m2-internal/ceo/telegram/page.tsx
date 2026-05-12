"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Bot, 
  Activity, 
  Send, 
  Settings, 
  RefreshCw,
  MessageSquare,
  CheckCircle,
  XCircle,
  ExternalLink,
  Megaphone,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Link,
  Eye,
  Clock,
  Bell,
  Zap,
  DollarSign,
  Percent,
  Webhook,
  Copy,
  Check,
  Search,
  Filter
} from "lucide-react";

interface TelegramLog {
  id: string;
  telegram_id: string;
  action: string;
  command: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

interface TelegramStats {
  actions_today: number;
  deposits_today: number;
  withdrawals_today: number;
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

export default function TelegramPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "send" | "config">("overview");
  const [settings, setSettings] = useState<TelegramSettings | null>(null);
  const [stats, setStats] = useState<TelegramStats | null>(null);
  const [logs, setLogs] = useState<TelegramLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageChannel, setMessageChannel] = useState<"sales" | "announcements">("announcements");
  const [searchLogs, setSearchLogs] = useState("");
  const [webhookStatus, setWebhookStatus] = useState<"ok" | "error" | "loading">("loading");
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar configuracoes
      const settingsRes = await fetch("/api/telegram/settings");
      const settingsData = await settingsRes.json();
      setSettings(settingsData.settings);

      // Buscar logs e stats
      const logsRes = await fetch("/api/telegram/logs");
      const logsData = await logsRes.json();
      setLogs(logsData.logs || []);
      setStats(logsData.stats || null);
      
      // Verificar webhook
      checkWebhook();
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkWebhook = async () => {
    setWebhookStatus("loading");
    try {
      const res = await fetch("/api/telegram/webhook-status");
      const data = await res.json();
      setWebhookStatus(data.ok && !data.lastError ? "ok" : "error");
    } catch {
      setWebhookStatus("error");
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sendAnnouncement = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      const res = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: message.trim(),
          channel: messageChannel
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setMessage("");
        alert("Mensagem enviada com sucesso!");
      } else {
        alert("Erro ao enviar: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      alert("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const toggleBot = async () => {
    try {
      const res = await fetch("/api/telegram/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_enabled: !settings?.bot_enabled }),
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText("https://www.legacypay.site/api/telegram/webhook");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(searchLogs.toLowerCase()) ||
    log.command?.toLowerCase().includes(searchLogs.toLowerCase())
  );

  const templates = [
    {
      name: "Manutencao",
      icon: "🔧",
      text: "🔧 <b>MANUTENCAO PROGRAMADA</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nInformaremos quando voltar ao normal.\n\n💬 Discord: https://discord.gg/ea32hgRSeM\n📱 WhatsApp: (34) 99935-3187\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    },
    {
      name: "Novidade",
      icon: "🎉",
      text: "🎉 <b>NOVIDADE!</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAcabamos de lancar uma nova funcionalidade!\n\nAcesse o painel para conferir.\n\n🌐 https://www.legacypay.site\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    },
    {
      name: "Promocao",
      icon: "🔥",
      text: "🔥 <b>PROMOCAO ESPECIAL</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAproveite taxas reduzidas!\n\nValido por tempo limitado.\n\n🌐 https://www.legacypay.site\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    },
    {
      name: "Sistema OK",
      icon: "✅",
      text: "✅ <b>SISTEMA NORMALIZADO</b>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nTodos os servicos estao funcionando normalmente.\n\nObrigado pela paciencia!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Bot Telegram</h1>
              <p className="text-muted-foreground">Gerenciar bot e notificacoes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Wallet className="w-6 h-6 text-white" />
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
            className="bg-card border border-border rounded-2xl p-5 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Discord</h3>
            <p className="text-sm text-muted-foreground">Suporte</p>
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-4">
          {[
            { id: "overview", label: "Visao Geral", icon: Eye },
            { id: "logs", label: "Logs", icon: Activity },
            { id: "send", label: "Enviar Aviso", icon: Send },
            { id: "config", label: "Configuracoes", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    settings?.bot_enabled 
                      ? "bg-green-500/20 text-green-500" 
                      : "bg-red-500/20 text-red-500"
                  }`}>
                    {settings?.bot_enabled ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Bot</h3>
                <p className="text-sm text-muted-foreground">@Legacypay_bot</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <Webhook className="w-6 h-6 text-green-500" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    webhookStatus === "ok"
                      ? "bg-green-500/20 text-green-500" 
                      : webhookStatus === "error"
                      ? "bg-red-500/20 text-red-500"
                      : "bg-yellow-500/20 text-yellow-500"
                  }`}>
                    {webhookStatus === "ok" ? "OK" : webhookStatus === "error" ? "Erro" : "..."}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Webhook</h3>
                <p className="text-sm text-muted-foreground">Status da conexao</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground">{stats?.actions_today || 0}</h3>
                <p className="text-sm text-muted-foreground">Interacoes Hoje</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground">{formatCurrency(stats?.fees_today || 0)}</h3>
                <p className="text-sm text-muted-foreground">Taxas Hoje</p>
              </div>
            </div>

            {/* Taxas Info */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary" />
                Taxas do Bot
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <ArrowDownCircle className="w-6 h-6 text-green-500" />
                    <span className="font-semibold text-foreground">Deposito PIX</span>
                  </div>
                  <p className="text-2xl font-bold text-green-500">5%</p>
                  <p className="text-sm text-muted-foreground">Ex: R$100 = R$5 taxa, recebe R$95</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <ArrowUpCircle className="w-6 h-6 text-blue-500" />
                    <span className="font-semibold text-foreground">Saque PIX</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-500">R$ 7,00</p>
                  <p className="text-sm text-muted-foreground">Taxa fixa por saque</p>
                </div>
              </div>
            </div>

            {/* Atividade Recente */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Atividade Recente
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      log.action === "MESSAGE" ? "bg-blue-500/20" :
                      log.action === "CALLBACK" ? "bg-purple-500/20" :
                      "bg-gray-500/20"
                    }`}>
                      {log.action === "MESSAGE" ? (
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Zap className="w-5 h-5 text-purple-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {log.action}: {log.command || "-"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {log.telegram_id}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhuma atividade registrada</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por acao ou comando..."
                  value={searchLogs}
                  onChange={(e) => setSearchLogs(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Acao</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Comando</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Telegram ID</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          log.action === "MESSAGE" ? "bg-blue-500/20 text-blue-500" :
                          log.action === "CALLBACK" ? "bg-purple-500/20 text-purple-500" :
                          "bg-gray-500/20 text-gray-500"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-foreground">{log.command || "-"}</td>
                      <td className="p-4 text-muted-foreground">{log.telegram_id}</td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum log encontrado
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "send" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" />
                Enviar Aviso
              </h3>
              <p className="text-muted-foreground mb-6">
                Envie uma mensagem para o canal de avisos (@legacypayavisos)
              </p>

              {/* Templates */}
              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground mb-3">Templates rapidos:</p>
                <div className="flex flex-wrap gap-2">
                  {templates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => setMessage(template.text)}
                      className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
                    >
                      <span>{template.icon}</span>
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Canal de destino
                  </label>
                  <select
                    value={messageChannel}
                    onChange={(e) => setMessageChannel(e.target.value as "sales" | "announcements")}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="announcements">Canal de Avisos (@legacypayavisos)</option>
                    <option value="sales">Canal de Vendas (@legacypaybot)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Mensagem (suporta HTML: &lt;b&gt;, &lt;i&gt;, &lt;code&gt;)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={10}
                    placeholder="Digite sua mensagem..."
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                  />
                </div>

                <button
                  onClick={sendAnnouncement}
                  disabled={sending || !message.trim()}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {sending ? "Enviando..." : "Enviar Mensagem"}
                </button>
              </div>
            </div>

            {/* Preview */}
            {message && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Pre-visualizacao:</h4>
                <div className="bg-[#1e2124] rounded-xl p-4 text-white font-sans text-sm whitespace-pre-wrap" 
                  dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, '<br/>') }} 
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "config" && (
          <div className="space-y-6">
            {/* Status do Bot */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Status do Bot
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Bot Telegram</p>
                  <p className="text-sm text-muted-foreground">@Legacypay_bot</p>
                </div>
                <button
                  onClick={toggleBot}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings?.bot_enabled ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    settings?.bot_enabled ? "left-8" : "left-1"
                  }`} />
                </button>
              </div>
            </div>

            {/* Canais */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Link className="w-5 h-5 text-primary" />
                Canais Configurados
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">Canal de Vendas</p>
                    <p className="text-sm text-muted-foreground">Depositos, saques, novos usuarios</p>
                  </div>
                  <a
                    href="https://t.me/legacypaybot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    @legacypaybot
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">Canal de Avisos</p>
                    <p className="text-sm text-muted-foreground">Comunicados gerais</p>
                  </div>
                  <a
                    href="https://t.me/legacypayavisos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    @legacypayavisos
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Webhook */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Webhook className="w-5 h-5 text-primary" />
                Webhook
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    webhookStatus === "ok" ? "bg-green-500" :
                    webhookStatus === "error" ? "bg-red-500" : "bg-yellow-500 animate-pulse"
                  }`} />
                  <span className="text-sm text-muted-foreground">
                    {webhookStatus === "ok" ? "Conectado" :
                     webhookStatus === "error" ? "Erro na conexao" : "Verificando..."}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value="https://www.legacypay.site/api/telegram/webhook"
                    readOnly
                    className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl text-sm text-muted-foreground"
                  />
                  <button
                    onClick={copyWebhookUrl}
                    className="px-4 py-3 bg-muted border border-border rounded-xl hover:bg-muted/80 transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Taxas */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary" />
                Taxas do Bot
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Deposito PIX</p>
                  <p className="text-xl font-bold text-foreground">5%</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Saque PIX</p>
                  <p className="text-xl font-bold text-foreground">R$ 7,00 fixo</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
