"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Download,
  Trash2,
  Clock,
  RefreshCw,
  Loader2,
  HardDrive,
  Calendar,
  Shield,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Backup {
  id: string;
  name: string;
  size: number;
  created_at: string;
  url: string;
}

interface BackupConfig {
  auto_backup_enabled: boolean;
  backup_frequency: "daily" | "weekly" | "monthly";
  retention_days: number;
  last_backup: string | null;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [config, setConfig] = useState<BackupConfig>({
    auto_backup_enabled: false,
    backup_frequency: "daily",
    retention_days: 30,
    last_backup: null,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  async function loadBackups() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/backup");
      const data = await response.json();
      if (data.backups) {
        setBackups(data.backups);
      }
      if (data.config) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error("Error loading backups:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createBackup() {
    setCreating(true);
    try {
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await response.json();
      if (data.success) {
        loadBackups();
        alert("Backup criado com sucesso!");
      } else {
        alert("Erro ao criar backup: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      alert("Erro ao criar backup");
    } finally {
      setCreating(false);
    }
  }

  async function deleteBackup(backup: Backup) {
    if (!confirm(`Tem certeza que deseja deletar o backup "${backup.name}"?`)) {
      return;
    }

    setDeleting(backup.id);
    try {
      const response = await fetch("/api/admin/backup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname: backup.id }),
      });
      const data = await response.json();
      if (data.success) {
        loadBackups();
      }
    } catch (error) {
      console.error("Error deleting backup:", error);
    } finally {
      setDeleting(null);
    }
  }

  async function saveConfig() {
    setSavingConfig(true);
    try {
      await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_config", config }),
      });
    } catch (error) {
      console.error("Error saving config:", error);
    } finally {
      setSavingConfig(false);
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getTimeSinceLastBackup() {
    if (!config.last_backup) return "Nunca";
    const diff = Date.now() - new Date(config.last_backup).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} dias atras`;
    if (hours > 0) return `${hours} horas atras`;
    return "Agora mesmo";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Backup de Dados</h1>
          <p className="text-muted-foreground">Exportacao automatica e manual dos dados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadBackups}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={createBackup} disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Criar Backup
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <HardDrive className="w-4 h-4" />
            <span className="text-xs">Total de Backups</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{backups.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Ultimo Backup</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{getTimeSinceLastBackup()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs">Status</span>
          </div>
          <div className="flex items-center gap-2">
            {config.auto_backup_enabled ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Automatico</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Manual</span>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Configuracao */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Configuracao de Backup</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Backup Automatico</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfig({ ...config, auto_backup_enabled: !config.auto_backup_enabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${config.auto_backup_enabled ? "bg-primary" : "bg-secondary"}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.auto_backup_enabled ? "left-7" : "left-1"}`} />
              </button>
              <span className="text-sm text-foreground">{config.auto_backup_enabled ? "Ativo" : "Inativo"}</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Frequencia</label>
            <select
              value={config.backup_frequency}
              onChange={(e) => setConfig({ ...config, backup_frequency: e.target.value as BackupConfig["backup_frequency"] })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Retencao (dias)</label>
            <input
              type="number"
              value={config.retention_days}
              onChange={(e) => setConfig({ ...config, retention_days: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50"
              min={1}
              max={365}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={saveConfig} disabled={savingConfig}>
            {savingConfig ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configuracao"
            )}
          </Button>
        </div>
      </motion.div>

      {/* Lista de Backups */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Backups Disponiveis</h2>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 text-center">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum backup encontrado</p>
            <Button onClick={createBackup} className="mt-4" disabled={creating}>
              Criar primeiro backup
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {backups.map((backup) => (
              <div key={backup.id} className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{backup.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{formatDate(backup.created_at)}</span>
                      <span>{formatSize(backup.size)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={backup.url}
                    download
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => deleteBackup(backup)}
                    disabled={deleting === backup.id}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400 disabled:opacity-50"
                    title="Deletar"
                  >
                    {deleting === backup.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
