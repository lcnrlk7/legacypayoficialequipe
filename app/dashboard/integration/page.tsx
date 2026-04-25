"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Globe,
  Code,
  Plus,
  Trash2,
  Settings,
  ExternalLink,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Link2,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  client_id: string;
  client_secret: string;
  webhook_url: string | null;
  webhook_secret: string;
  is_active: boolean;
  created_at: string;
}

interface Profile {
  api_key: string;
}

export default function IntegrationPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(7);
  const [remaining, setRemaining] = useState(7);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formWebhook, setFormWebhook] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // UI states
  const [copied, setCopied] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [webhookTestResult, setWebhookTestResult] = useState<Record<string, { success: boolean; message: string } | null>>({});

  useEffect(() => {
    loadIntegrations();
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Erro ao carregar profile:", error);
    }
  }

  async function loadIntegrations() {
    try {
      const response = await fetch("/api/user/integrations");
      const data = await response.json();
      if (data.success) {
        setIntegrations(data.integrations);
        setLimit(data.limit);
        setRemaining(data.remaining);
      }
    } catch (error) {
      console.error("Erro ao carregar integracoes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createIntegration() {
    if (!formName.trim()) return;
    setFormLoading(true);
    try {
      const response = await fetch("/api/user/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          website_url: formWebsite,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setFormName("");
        setFormDescription("");
        setFormWebsite("");
        loadIntegrations();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Erro ao criar integracao");
    } finally {
      setFormLoading(false);
    }
  }

  async function updateIntegration() {
    if (!selectedIntegration) return;
    setFormLoading(true);
    try {
      const response = await fetch("/api/user/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedIntegration.id,
          name: formName,
          description: formDescription,
          website_url: formWebsite,
          webhook_url: formWebhook,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShowEditModal(false);
        loadIntegrations();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Erro ao atualizar integracao");
    } finally {
      setFormLoading(false);
    }
  }

  async function deleteIntegration(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta integracao? Esta acao nao pode ser desfeita.")) return;
    try {
      const response = await fetch(`/api/user/integrations?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        loadIntegrations();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Erro ao excluir integracao");
    }
  }

  async function toggleIntegration(integration: Integration) {
    try {
      const response = await fetch("/api/user/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: integration.id, is_active: !integration.is_active }),
      });
      const data = await response.json();
      if (data.success) {
        loadIntegrations();
      }
    } catch {
      alert("Erro ao atualizar status");
    }
  }

  async function regenerateSecret(integrationId: string, type: "client" | "webhook") {
    if (!confirm(`Tem certeza que deseja regenerar o ${type === "client" ? "Client Secret" : "Webhook Secret"}? As credenciais antigas deixarao de funcionar.`)) return;
    try {
      const response = await fetch("/api/user/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: integrationId, regenerate_secret: type }),
      });
      const data = await response.json();
      if (data.success) {
        loadIntegrations();
        alert("Secret regenerado com sucesso!");
      }
    } catch {
      alert("Erro ao regenerar secret");
    }
  }

  async function testWebhook(integration: Integration) {
    if (!integration.webhook_url) {
      alert("Configure a URL do webhook primeiro");
      return;
    }
    setTestingWebhook(integration.id);
    setWebhookTestResult({ ...webhookTestResult, [integration.id]: null });
    try {
      const response = await fetch("/api/user/credentials/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integration_id: integration.id }),
      });
      const data = await response.json();
      setWebhookTestResult({
        ...webhookTestResult,
        [integration.id]: { success: data.success, message: data.message },
      });
    } catch {
      setWebhookTestResult({
        ...webhookTestResult,
        [integration.id]: { success: false, message: "Erro ao testar webhook" },
      });
    } finally {
      setTestingWebhook(null);
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function openEditModal(integration: Integration) {
    setSelectedIntegration(integration);
    setFormName(integration.name);
    setFormDescription(integration.description || "");
    setFormWebsite(integration.website_url || "");
    setFormWebhook(integration.webhook_url || "");
    setShowEditModal(true);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Integracoes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie suas integracoes com outros sites ({integrations.length}/{limit})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDocsModal(true)} size="sm" className="sm:size-default">
            <Code className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Documentacao</span>
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={remaining <= 0}
            className="bg-primary hover:bg-primary/90"
            size="sm"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova Integracao</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {/* Sua Chave API */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-4 sm:p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Sua Chave API
            </h2>
            <p className="text-xs text-muted-foreground">
              Use esta chave para autenticar suas requisicoes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 bg-secondary rounded-lg sm:rounded-xl p-3 sm:p-4">
          <code className="flex-1 text-xs sm:text-sm text-muted-foreground font-mono truncate">
            {showApiKey 
              ? (profile?.api_key || "Carregando...") 
              : "••••••••••••••••••••••••••••••••••••••••"}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowApiKey(!showApiKey)}
            className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
            title={showApiKey ? "Esconder" : "Mostrar"}
          >
            {showApiKey ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (profile?.api_key) {
                copyToClipboard(profile.api_key, "api_key");
              }
            }}
            className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
            title="Copiar"
          >
            {copied === "api_key" ? (
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
            ) : (
              <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3">
          Mantenha sua chave em segredo! Nao a compartilhe publicamente.
        </p>
        <a href="/docs" className="text-primary text-xs sm:text-sm hover:underline mt-2 inline-block">
          Ver documentacao da API
        </a>
      </motion.div>

      {/* Integrations List */}
      {integrations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Link2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma integracao criada
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Crie sua primeira integracao para conectar seu site e comecar a receber pagamentos via API.
          </p>
          <Button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Integracao
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-card border rounded-2xl p-4 sm:p-6 ${
                integration.is_active ? "border-border" : "border-yellow-500/30 bg-yellow-500/5"
              }`}
            >
              {/* Integration Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    integration.is_active ? "bg-primary/10" : "bg-yellow-500/10"
                  }`}>
                    <Globe className={`w-5 h-5 ${integration.is_active ? "text-primary" : "text-yellow-500"}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{integration.name}</h3>
                      {!integration.is_active && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">
                          Desativada
                        </span>
                      )}
                    </div>
                    {integration.description && (
                      <p className="text-sm text-muted-foreground truncate">{integration.description}</p>
                    )}
                    {integration.website_url && (
                      <a
                        href={integration.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        <span className="truncate max-w-[200px]">{integration.website_url}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Criada em {formatDate(integration.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleIntegration(integration)}
                    className={`text-xs ${integration.is_active ? "" : "border-green-500/30 text-green-500 hover:bg-green-500/10"}`}
                  >
                    {integration.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEditModal(integration)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteIntegration(integration.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-3 bg-secondary/30 rounded-xl p-3 sm:p-4">
                {/* Client ID */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Client ID</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded-lg text-xs sm:text-sm font-mono text-foreground truncate">
                      {integration.client_id}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(integration.client_id, `client_id_${integration.id}`)}
                    >
                      {copied === `client_id_${integration.id}` ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Client Secret */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Client Secret</label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded-lg text-xs sm:text-sm font-mono text-foreground truncate">
                      {showSecrets[`client_${integration.id}`]
                        ? integration.client_secret
                        : "••••••••••••••••••••••••"}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowSecrets({
                          ...showSecrets,
                          [`client_${integration.id}`]: !showSecrets[`client_${integration.id}`],
                        })
                      }
                    >
                      {showSecrets[`client_${integration.id}`] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(integration.client_secret, `client_secret_${integration.id}`)}
                    >
                      {copied === `client_secret_${integration.id}` ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => regenerateSecret(integration.id, "client")}
                      title="Regenerar Client Secret"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Webhook URL */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Webhook URL</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded-lg text-xs sm:text-sm font-mono text-foreground truncate">
                      {integration.webhook_url || "Nao configurado"}
                    </code>
                    {integration.webhook_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhook(integration)}
                        disabled={testingWebhook === integration.id}
                        className="text-xs"
                      >
                        {testingWebhook === integration.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Testar"
                        )}
                      </Button>
                    )}
                  </div>
                  {webhookTestResult[integration.id] && (
                    <div
                      className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
                        webhookTestResult[integration.id]?.success
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {webhookTestResult[integration.id]?.success ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      {webhookTestResult[integration.id]?.message}
                    </div>
                  )}
                </div>

                {/* Webhook Secret */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Webhook Secret</label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded-lg text-xs sm:text-sm font-mono text-foreground truncate">
                      {showSecrets[`webhook_${integration.id}`]
                        ? integration.webhook_secret
                        : "••••••••••••••••••••••••"}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowSecrets({
                          ...showSecrets,
                          [`webhook_${integration.id}`]: !showSecrets[`webhook_${integration.id}`],
                        })
                      }
                    >
                      {showSecrets[`webhook_${integration.id}`] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(integration.webhook_secret, `webhook_secret_${integration.id}`)}
                    >
                      {copied === `webhook_secret_${integration.id}` ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Remaining Slots */}
      {remaining > 0 && integrations.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Voce pode criar mais {remaining} integracao{remaining > 1 ? "es" : ""}
        </p>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md relative"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Nova Integracao</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Crie credenciais para integrar com seu site
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Nome da Integracao *
                  </label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Minha Loja Online"
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Descricao (opcional)
                  </label>
                  <Input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ex: Integracao para checkout da loja"
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    URL do Site (opcional)
                  </label>
                  <Input
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    placeholder="https://minhaloja.com.br"
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={createIntegration}
                    disabled={!formName.trim() || formLoading}
                  >
                    {formLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Criar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedIntegration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md relative"
            >
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Settings className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Editar Integracao</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Nome</label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Descricao</label>
                  <Input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">URL do Site</label>
                  <Input
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Webhook URL</label>
                  <Input
                    value={formWebhook}
                    onChange={(e) => setFormWebhook(e.target.value)}
                    placeholder="https://seu-site.com/api/webhook"
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={updateIntegration}
                    disabled={formLoading}
                  >
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Documentation Modal */}
      <AnimatePresence>
        {showDocsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 w-full max-w-2xl relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowDocsModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-foreground mb-6">Documentacao da API</h3>

              <div className="space-y-6">
                {/* Base URL */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Base URL</h4>
                  <code className="block p-3 bg-secondary rounded-lg text-xs sm:text-sm font-mono overflow-x-auto">
                    https://legacypay.site/api/v1/integration
                  </code>
                </div>

                {/* Auth */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Autenticacao</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Use Basic Auth com client_id:client_secret em Base64
                  </p>
                  <code className="block p-3 bg-secondary rounded-lg text-xs sm:text-sm font-mono overflow-x-auto">
                    Authorization: Basic base64(client_id:client_secret)
                  </code>
                </div>

                {/* Create PIX */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">1. Criar Cobranca PIX</h4>
                  <code className="block p-3 bg-secondary rounded-lg text-xs sm:text-sm font-mono whitespace-pre overflow-x-auto">
{`POST /pix

{
  "amount": 100.00,
  "external_id": "pedido_123",
  "description": "Pagamento do pedido",
  "payer": {
    "name": "Cliente",
    "document": "12345678900"
  }
}`}
                  </code>
                </div>

                {/* Response */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Resposta</h4>
                  <code className="block p-3 bg-secondary rounded-lg text-xs sm:text-sm font-mono whitespace-pre overflow-x-auto text-green-400">
{`{
  "success": true,
  "data": {
    "transaction_id": "uuid",
    "external_id": "pedido_123",
    "amount": 100.00,
    "fee": 2.75,
    "net_amount": 97.25,
    "status": "pending",
    "pix": {
      "qr_code": "00020126...",
      "qr_code_base64": "data:image/png;base64,...",
      "copy_paste": "00020126..."
    },
    "expires_at": "2024-01-01T00:30:00Z"
  }
}`}
                  </code>
                </div>

                {/* Check Status */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">2. Consultar Status</h4>
                  <code className="block p-3 bg-secondary rounded-lg text-xs sm:text-sm font-mono overflow-x-auto">
                    GET /pix?transaction_id=uuid
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">ou</p>
                  <code className="block p-3 bg-secondary rounded-lg text-xs sm:text-sm font-mono overflow-x-auto mt-1">
                    GET /pix?external_id=pedido_123
                  </code>
                </div>

                {/* Balance */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">3. Consultar Saldo</h4>
                  <code className="block p-3 bg-secondary rounded-lg text-xs sm:text-sm font-mono overflow-x-auto">
                    GET /balance
                  </code>
                </div>

                {/* Transactions */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">4. Listar Transacoes</h4>
                  <code className="block p-3 bg-secondary rounded-lg text-xs sm:text-sm font-mono overflow-x-auto">
                    GET /transactions?status=completed&limit=50
                  </code>
                </div>

                {/* Webhook */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Webhook</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Configure uma URL de webhook para receber notificacoes:
                  </p>
                  <code className="block p-3 bg-secondary rounded-lg text-xs sm:text-sm font-mono whitespace-pre overflow-x-auto">
{`{
  "event": "payment.completed",
  "data": {
    "transaction_id": "uuid",
    "external_id": "pedido_123",
    "status": "completed",
    "amount": 100.00,
    "net_amount": 97.25,
    "paid_at": "2024-01-01T00:05:00Z"
  }
}`}
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Valide usando o header X-Webhook-Signature com seu webhook_secret
                  </p>
                </div>

                {/* Code Example */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Exemplo Node.js</h4>
                  <code className="block p-3 bg-secondary rounded-lg text-xs sm:text-sm font-mono whitespace-pre overflow-x-auto">
{`// Criar credenciais em Base64
const credentials = Buffer.from(
  \`\${CLIENT_ID}:\${CLIENT_SECRET}\`
).toString('base64');

// Criar cobranca PIX
const response = await fetch(
  'https://legacypay.site/api/v1/integration/pix',
  {
    method: 'POST',
    headers: {
      'Authorization': \`Basic \${credentials}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 100.00,
      external_id: 'pedido_123',
      description: 'Pagamento do pedido #123'
    })
  }
);

const data = await response.json();
console.log(data.data.pix.copy_paste);`}
                  </code>
                </div>

                {/* Status Codes */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Status das Transacoes</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      <span className="text-muted-foreground">pending - Aguardando</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-muted-foreground">completed - Pago</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="text-muted-foreground">expired - Expirado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                      <span className="text-muted-foreground">cancelled - Cancelado</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
