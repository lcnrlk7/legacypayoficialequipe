"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Server,
  Database,
  CreditCard,
  Shield,
  Zap,
  Globe,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  TrendingUp,
  TrendingDown,
  History,
  Bell,
  Settings,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceStatus {
  id: string;
  name: string;
  description: string;
  status: "operational" | "degraded" | "outage" | "maintenance";
  latency: number;
  uptime: number;
  lastCheck: string;
  responseTime: number[];
  errorRate: number;
  requestsPerMin: number;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  services: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  updates: {
    message: string;
    timestamp: string;
    status: string;
  }[];
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  activeConnections: number;
  requestsToday: number;
  errorsToday: number;
}

const STATUS_CONFIG = {
  operational: { color: "bg-green-500", text: "text-green-500", label: "Operacional" },
  degraded: { color: "bg-yellow-500", text: "text-yellow-500", label: "Degradado" },
  outage: { color: "bg-red-500", text: "text-red-500", label: "Fora do Ar" },
  maintenance: { color: "bg-blue-500", text: "text-blue-500", label: "Manutencao" },
};

const SEVERITY_CONFIG = {
  minor: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", label: "Menor" },
  major: { color: "bg-orange-500/10 text-orange-500 border-orange-500/30", label: "Maior" },
  critical: { color: "bg-red-500/10 text-red-500 border-red-500/30", label: "Critico" },
};

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    try {
      // Mock data - replace with actual API calls
      const mockServices: ServiceStatus[] = [
        {
          id: "api-gateway",
          name: "API Gateway",
          description: "Gateway principal de APIs",
          status: "operational",
          latency: 45,
          uptime: 99.98,
          lastCheck: new Date().toISOString(),
          responseTime: [42, 45, 38, 51, 44, 47, 43, 46, 41, 45],
          errorRate: 0.02,
          requestsPerMin: 1250,
        },
        {
          id: "pix-in",
          name: "PIX In (Depositos)",
          description: "Processamento de depositos PIX",
          status: "operational",
          latency: 120,
          uptime: 99.95,
          lastCheck: new Date().toISOString(),
          responseTime: [115, 118, 125, 110, 122, 119, 128, 116, 121, 120],
          errorRate: 0.05,
          requestsPerMin: 890,
        },
        {
          id: "pix-out",
          name: "PIX Out (Saques)",
          description: "Processamento de saques PIX",
          status: "operational",
          latency: 180,
          uptime: 99.92,
          lastCheck: new Date().toISOString(),
          responseTime: [175, 182, 178, 190, 185, 172, 188, 176, 183, 180],
          errorRate: 0.08,
          requestsPerMin: 340,
        },
        {
          id: "database",
          name: "Banco de Dados",
          description: "PostgreSQL primary + replicas",
          status: "operational",
          latency: 12,
          uptime: 99.99,
          lastCheck: new Date().toISOString(),
          responseTime: [10, 12, 11, 13, 12, 11, 14, 12, 11, 12],
          errorRate: 0.01,
          requestsPerMin: 5600,
        },
        {
          id: "medusa",
          name: "Medusa Gateway",
          description: "Gateway de pagamentos Medusa",
          status: "operational",
          latency: 230,
          uptime: 99.85,
          lastCheck: new Date().toISOString(),
          responseTime: [220, 235, 228, 245, 232, 225, 238, 227, 233, 230],
          errorRate: 0.15,
          requestsPerMin: 450,
        },
        {
          id: "webhooks",
          name: "Webhooks",
          description: "Disparo de notificacoes webhook",
          status: "operational",
          latency: 85,
          uptime: 99.90,
          lastCheck: new Date().toISOString(),
          responseTime: [80, 88, 82, 90, 85, 78, 92, 84, 86, 85],
          errorRate: 0.10,
          requestsPerMin: 680,
        },
        {
          id: "telegram",
          name: "Bot Telegram",
          description: "Bot de notificacoes Telegram",
          status: "operational",
          latency: 150,
          uptime: 99.88,
          lastCheck: new Date().toISOString(),
          responseTime: [145, 152, 148, 158, 150, 142, 155, 147, 153, 150],
          errorRate: 0.12,
          requestsPerMin: 220,
        },
        {
          id: "cdn",
          name: "CDN / Assets",
          description: "Entrega de arquivos estaticos",
          status: "operational",
          latency: 25,
          uptime: 99.99,
          lastCheck: new Date().toISOString(),
          responseTime: [22, 25, 24, 28, 25, 23, 26, 24, 25, 25],
          errorRate: 0.01,
          requestsPerMin: 3200,
        },
      ];

      const mockIncidents: Incident[] = [
        {
          id: "1",
          title: "Lentidao no processamento de saques",
          description: "Usuarios reportaram lentidao ao processar saques PIX.",
          status: "resolved",
          severity: "minor",
          services: ["pix-out"],
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
          resolvedAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
          updates: [
            { message: "Investigando relatos de lentidao", timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), status: "investigating" },
            { message: "Identificado gargalo no banco de dados", timestamp: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(), status: "identified" },
            { message: "Problema resolvido. Sistema normalizado.", timestamp: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(), status: "resolved" },
          ],
        },
      ];

      const mockMetrics: SystemMetrics = {
        cpu: 34,
        memory: 62,
        disk: 45,
        network: { in: 125, out: 89 },
        activeConnections: 1847,
        requestsToday: 458920,
        errorsToday: 234,
      };

      setServices(mockServices);
      setIncidents(mockIncidents);
      setMetrics(mockMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const overallStatus = services.every(s => s.status === "operational")
    ? "operational"
    : services.some(s => s.status === "outage")
    ? "outage"
    : services.some(s => s.status === "degraded")
    ? "degraded"
    : "maintenance";

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            Status do Sistema
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento em tempo real de todos os servicos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground">
            Ultima atualizacao: {formatTime(lastUpdate.toISOString())}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "text-green-500" : ""}
          >
            {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {autoRefresh ? "Auto" : "Pausado"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`p-4 rounded-xl border ${
        overallStatus === "operational" ? "bg-green-500/10 border-green-500/30" :
        overallStatus === "degraded" ? "bg-yellow-500/10 border-yellow-500/30" :
        overallStatus === "outage" ? "bg-red-500/10 border-red-500/30" :
        "bg-blue-500/10 border-blue-500/30"
      }`}>
        <div className="flex items-center gap-3">
          {overallStatus === "operational" ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : overallStatus === "degraded" ? (
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          ) : overallStatus === "outage" ? (
            <XCircle className="w-6 h-6 text-red-500" />
          ) : (
            <Clock className="w-6 h-6 text-blue-500" />
          )}
          <div>
            <div className={`font-semibold ${STATUS_CONFIG[overallStatus].text}`}>
              {overallStatus === "operational" ? "Todos os sistemas operacionais" :
               overallStatus === "degraded" ? "Alguns sistemas com degradacao" :
               overallStatus === "outage" ? "Interrupcao detectada" :
               "Manutencao em andamento"}
            </div>
            <div className="text-sm text-muted-foreground">
              {services.filter(s => s.status === "operational").length} de {services.length} servicos operacionais
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Cpu className="w-4 h-4" />
              CPU
            </div>
            <div className="text-2xl font-bold">{metrics.cpu}%</div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${metrics.cpu > 80 ? "bg-red-500" : metrics.cpu > 60 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${metrics.cpu}%` }} />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MemoryStick className="w-4 h-4" />
              Memoria
            </div>
            <div className="text-2xl font-bold">{metrics.memory}%</div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${metrics.memory > 80 ? "bg-red-500" : metrics.memory > 60 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${metrics.memory}%` }} />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <HardDrive className="w-4 h-4" />
              Disco
            </div>
            <div className="text-2xl font-bold">{metrics.disk}%</div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${metrics.disk > 80 ? "bg-red-500" : metrics.disk > 60 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${metrics.disk}%` }} />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Wifi className="w-4 h-4" />
              Conexoes
            </div>
            <div className="text-2xl font-bold">{metrics.activeConnections.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">ativas agora</div>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Requests Hoje
            </div>
            <div className="text-2xl font-bold">{(metrics.requestsToday / 1000).toFixed(1)}K</div>
            <div className="text-xs text-green-500 mt-1">+12% vs ontem</div>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Erros Hoje
            </div>
            <div className="text-2xl font-bold text-red-500">{metrics.errorsToday}</div>
            <div className="text-xs text-muted-foreground mt-1">{((metrics.errorsToday / metrics.requestsToday) * 100).toFixed(3)}% taxa</div>
          </div>
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Globe className="w-4 h-4" />
              Network
            </div>
            <div className="text-lg font-bold">
              <span className="text-green-500">{metrics.network.in}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-blue-500">{metrics.network.out}</span>
              <span className="text-xs text-muted-foreground ml-1">MB/s</span>
            </div>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Servicos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => (
            <div key={service.id} className="p-4 rounded-xl bg-card border hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium">{service.name}</div>
                  <div className="text-xs text-muted-foreground">{service.description}</div>
                </div>
                <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[service.status].color}`} />
              </div>
              
              {/* Mini Chart */}
              <div className="flex items-end gap-0.5 h-8 mb-3">
                {service.responseTime.map((time, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/30 rounded-t"
                    style={{ height: `${(time / Math.max(...service.responseTime)) * 100}%` }}
                  />
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">Latencia</div>
                  <div className="text-sm font-medium">{service.latency}ms</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Uptime</div>
                  <div className="text-sm font-medium text-green-500">{service.uptime}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Req/min</div>
                  <div className="text-sm font-medium">{service.requestsPerMin}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incidents */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          Historico de Incidentes
        </h2>
        {incidents.length === 0 ? (
          <div className="p-8 rounded-xl bg-card border text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <div className="font-medium">Nenhum incidente recente</div>
            <div className="text-sm text-muted-foreground">Todos os sistemas estao funcionando normalmente</div>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div key={incident.id} className="p-4 rounded-xl bg-card border">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="font-medium">{incident.title}</div>
                    <div className="text-sm text-muted-foreground">{incident.description}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${SEVERITY_CONFIG[incident.severity].color}`}>
                    {SEVERITY_CONFIG[incident.severity].label}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {incident.services.map((svc) => (
                    <span key={svc} className="px-2 py-0.5 bg-muted rounded text-xs">
                      {services.find(s => s.id === svc)?.name || svc}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 border-l-2 border-muted pl-4">
                  {incident.updates.map((update, i) => (
                    <div key={i} className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatDate(update.timestamp)}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          update.status === "resolved" ? "bg-green-500/10 text-green-500" :
                          update.status === "investigating" ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-blue-500/10 text-blue-500"
                        }`}>
                          {update.status}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-0.5">{update.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
