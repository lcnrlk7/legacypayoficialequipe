"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, Ban, RefreshCw, Activity, Globe, Clock, Filter } from "lucide-react";

interface AttackLog {
  id: string;
  attack_type: string;
  ip_address: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  payload: string | null;
  user_agent: string | null;
  endpoint: string | null;
  severity: string;
  blocked: boolean;
  created_at: string;
}

interface AttackStats {
  total: number;
  today: number;
  critical: number;
  high: number;
  blocked: number;
  unique_ips: number;
  byType: { attack_type: string; count: number }[];
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const ATTACK_TYPE_LABELS: Record<string, string> = {
  XSS_ATTEMPT: "XSS",
  SQL_INJECTION: "SQL Injection",
  BRUTE_FORCE: "Forca Bruta",
  RATE_LIMIT: "Rate Limit",
  INVALID_INPUT: "Input Invalido",
  UNAUTHORIZED_ACCESS: "Acesso Nao Autorizado",
  SUSPICIOUS_ACTIVITY: "Atividade Suspeita",
};

export default function AttacksPage() {
  const [logs, setLogs] = useState<AttackLog[]>([]);
  const [stats, setStats] = useState<AttackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [testingWebhook, setTestingWebhook] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch("/api/admin/attacks"),
        fetch("/api/admin/attacks/stats"),
      ]);
      
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function testWebhook() {
    setTestingWebhook(true);
    try {
      const res = await fetch("/api/admin/attacks/test-webhook", { method: "POST" });
      if (res.ok) {
        alert("Webhook enviado! Verifique o canal do Discord.");
      } else {
        alert("Erro ao enviar webhook");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao testar webhook");
    } finally {
      setTestingWebhook(false);
    }
  }

  async function blockIp(ip: string) {
    if (!confirm(`Bloquear o IP ${ip}?`)) return;
    
    try {
      const res = await fetch("/api/admin/blocked-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip_address: ip, reason: "Bloqueio manual via painel de ataques" }),
      });
      
      if (res.ok) {
        alert(`IP ${ip} bloqueado com sucesso!`);
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao bloquear IP");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao bloquear IP");
    }
  }

  const filteredLogs = filter === "all" 
    ? logs 
    : logs.filter(log => log.attack_type === filter);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Central de Seguranca</h1>
              <p className="text-muted-foreground">Monitoramento de ataques e ameacas</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={testWebhook}
              disabled={testingWebhook}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {testingWebhook ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
              Testar Webhook
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-white rounded-xl flex items-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Total</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Hoje</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{stats.today}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm">Criticos</span>
              </div>
              <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-sm">Alto</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">{stats.high}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Ban className="w-4 h-4 text-green-400" />
                <span className="text-sm">Bloqueados</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{stats.blocked}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Globe className="w-4 h-4" />
                <span className="text-sm">IPs Unicos</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.unique_ips}</p>
            </div>
          </div>
        )}

        {/* Ataques por Tipo */}
        {stats && stats.byType && stats.byType.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Ataques por Tipo</h3>
            <div className="flex flex-wrap gap-3">
              {stats.byType.map((item) => (
                <div
                  key={item.attack_type}
                  className="px-4 py-2 bg-secondary rounded-lg flex items-center gap-2"
                >
                  <span className="text-muted-foreground">
                    {ATTACK_TYPE_LABELS[item.attack_type] || item.attack_type}
                  </span>
                  <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Filtrar:</span>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-secondary border border-border rounded-xl text-white focus:outline-none"
          >
            <option value="all">Todos os tipos</option>
            <option value="XSS_ATTEMPT">XSS</option>
            <option value="SQL_INJECTION">SQL Injection</option>
            <option value="BRUTE_FORCE">Forca Bruta</option>
            <option value="RATE_LIMIT">Rate Limit</option>
            <option value="INVALID_INPUT">Input Invalido</option>
            <option value="UNAUTHORIZED_ACCESS">Acesso Nao Autorizado</option>
            <option value="SUSPICIOUS_ACTIVITY">Atividade Suspeita</option>
          </select>
        </div>

        {/* Logs Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-4 text-muted-foreground font-medium">Data/Hora</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Tipo</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">IP</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Usuario</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Severidade</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Carregando...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      Nenhum ataque registrado
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm">
                          {ATTACK_TYPE_LABELS[log.attack_type] || log.attack_type}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-sm text-white">
                        {log.ip_address || "-"}
                      </td>
                      <td className="p-4 text-sm">
                        {log.user_email ? (
                          <div>
                            <p className="text-white">{log.user_name || "Sem nome"}</p>
                            <p className="text-muted-foreground text-xs">{log.user_email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Anonimo</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.medium}`}>
                          {log.severity?.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        {log.blocked ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            BLOQUEADO
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                            DETECTADO
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {log.ip_address && (
                          <button
                            onClick={() => blockIp(log.ip_address)}
                            className="p-2 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 rounded-lg transition-colors"
                            title="Bloquear IP"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalhes do Payload (expandivel) */}
        {filteredLogs.some(log => log.payload) && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Payloads Recentes</h3>
            <div className="space-y-3">
              {filteredLogs
                .filter(log => log.payload)
                .slice(0, 5)
                .map((log) => (
                  <div key={log.id} className="p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </span>
                      <span className="text-xs text-red-400">
                        {log.ip_address}
                      </span>
                    </div>
                    <code className="text-sm text-yellow-400 break-all">
                      {log.payload}
                    </code>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
