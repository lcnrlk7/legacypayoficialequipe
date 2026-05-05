"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Smartphone, 
  History, 
  Bell, 
  Loader2, 
  Check, 
  X,
  Monitor,
  Laptop,
  Globe,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";

interface LoginEntry {
  id: string;
  ip_address: string;
  device_type: string;
  browser: string;
  success: boolean;
  created_at: string;
}

interface EmailPreferences {
  payment_received: boolean;
  withdrawal_approved: boolean;
  withdrawal_rejected: boolean;
  ticket_response: boolean;
  login_alert: boolean;
  marketing: boolean;
}

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<"2fa" | "history" | "notifications">("2fa");
  const [loading, setLoading] = useState(true);
  
  // 2FA States
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState<"idle" | "setup" | "verify">("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableModal, setShowDisableModal] = useState(false);
  
  // Login History States
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);
  
  // Email Preferences States
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>({
    payment_received: true,
    withdrawal_approved: true,
    withdrawal_rejected: true,
    ticket_response: true,
    login_alert: true,
    marketing: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Carregar status 2FA
      const twoFaRes = await fetch("/api/user/2fa");
      const twoFaData = await twoFaRes.json();
      setIs2FAEnabled(twoFaData.enabled);

      // Carregar historico de logins
      const historyRes = await fetch("/api/user/login-history");
      const historyData = await historyRes.json();
      setLoginHistory(historyData.history || []);

      // Carregar preferencias de email
      const prefsRes = await fetch("/api/user/email-preferences");
      const prefsData = await prefsRes.json();
      if (prefsData.preferences) {
        setEmailPrefs({
          payment_received: prefsData.preferences.payment_received,
          withdrawal_approved: prefsData.preferences.withdrawal_approved,
          withdrawal_rejected: prefsData.preferences.withdrawal_rejected,
          ticket_response: prefsData.preferences.ticket_response,
          login_alert: prefsData.preferences.login_alert,
          marketing: prefsData.preferences.marketing,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup2FA() {
    try {
      const res = await fetch("/api/user/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
  const data = await res.json();
  if (data.success) {
  setQrCode(data.qrCode);
  setSecretKey(data.secret);
  setBackupCodes(data.backupCodes);
  setSetupStep("setup");
      }
    } catch (error) {
      console.error("Erro ao iniciar setup:", error);
    }
  }

  async function handleVerify2FA() {
    try {
      const res = await fetch("/api/user/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", token: verifyCode }),
      });
      const data = await res.json();
      if (data.success) {
        setIs2FAEnabled(true);
        setSetupStep("idle");
        setShowBackupCodes(true);
      } else {
        alert("Codigo invalido. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao verificar:", error);
    }
  }

  async function handleDisable2FA() {
    try {
      const res = await fetch("/api/user/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (data.success) {
        setIs2FAEnabled(false);
        setShowDisableModal(false);
        setDisablePassword("");
      } else {
        alert(data.error || "Erro ao desativar");
      }
    } catch (error) {
      console.error("Erro ao desativar:", error);
    }
  }

  async function handleSavePreferences() {
    setSavingPrefs(true);
    try {
      await fetch("/api/user/email-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailPrefs),
      });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSavingPrefs(false);
    }
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    alert("Codigos copiados!");
  }

  function getDeviceIcon(deviceType: string) {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="w-4 h-4" />;
      case "tablet":
        return <Laptop className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Seguranca
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie a seguranca da sua conta
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4">
        <Button
          variant={activeTab === "2fa" ? "default" : "ghost"}
          onClick={() => setActiveTab("2fa")}
          className="gap-2"
        >
          <Smartphone className="w-4 h-4" />
          Autenticacao 2FA
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "ghost"}
          onClick={() => setActiveTab("history")}
          className="gap-2"
        >
          <History className="w-4 h-4" />
          Historico de Logins
        </Button>
        <Button
          variant={activeTab === "notifications" ? "default" : "ghost"}
          onClick={() => setActiveTab("notifications")}
          className="gap-2"
        >
          <Bell className="w-4 h-4" />
          Notificacoes
        </Button>
      </div>

      {/* 2FA Tab */}
      {activeTab === "2fa" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-secondary/30 rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Autenticacao em Duas Etapas
                </h3>
                <p className="text-sm text-muted-foreground">
                  Adicione uma camada extra de seguranca usando um app autenticador
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                is2FAEnabled 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {is2FAEnabled ? "Ativado" : "Desativado"}
              </div>
            </div>

            {!is2FAEnabled && setupStep === "idle" && (
              <Button onClick={handleSetup2FA} className="gap-2">
                <Shield className="w-4 h-4" />
                Ativar 2FA
              </Button>
            )}

            {setupStep === "setup" && qrCode && (
              <div className="space-y-6">
                <div className="bg-background rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Escaneie o QR Code com seu app autenticador (Google Authenticator, Authy, etc)
                  </p>
                  <div className="inline-block bg-white p-4 rounded-lg">
                    <Image src={qrCode} alt="QR Code" width={200} height={200} />
                  </div>
                </div>

                {secretKey && (
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Ou adicione manualmente usando o codigo:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background px-3 py-2 rounded text-sm font-mono text-foreground break-all">
                        {secretKey}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(secretKey);
                          setCopiedSecret(true);
                          setTimeout(() => setCopiedSecret(false), 2000);
                        }}
                      >
                        {copiedSecret ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Digite o codigo do app:
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                    />
                    <Button onClick={handleVerify2FA} disabled={verifyCode.length !== 6}>
                      Verificar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {is2FAEnabled && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="w-5 h-5" />
                  <span>Sua conta esta protegida com 2FA</span>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDisableModal(true)}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Desativar 2FA
                </Button>
              </div>
            )}
          </div>

          {/* Backup Codes Modal */}
          {showBackupCodes && backupCodes.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-400">Codigos de Backup</h4>
                  <p className="text-sm text-muted-foreground">
                    Guarde esses codigos em um lugar seguro. Cada codigo so pode ser usado uma vez.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {backupCodes.map((code, i) => (
                  <code key={i} className="bg-background px-3 py-2 rounded text-center font-mono">
                    {code}
                  </code>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyBackupCodes} className="gap-2">
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
                <Button onClick={() => setShowBackupCodes(false)}>
                  Ja salvei os codigos
                </Button>
              </div>
            </div>
          )}

          {/* Disable Modal */}
          {showDisableModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 border border-border">
                <h3 className="text-lg font-semibold mb-4">Desativar 2FA</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Digite sua senha para confirmar a desativacao
                </p>
                <Input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Sua senha"
                  className="mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setShowDisableModal(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDisable2FA}>
                    Desativar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-secondary/30 rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Ultimos Acessos</h3>
              <p className="text-sm text-muted-foreground">
                Verifique os acessos recentes a sua conta
              </p>
            </div>
            
            {loginHistory.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum acesso registrado
              </div>
            ) : (
              <div className="divide-y divide-border">
                {loginHistory.map((entry) => (
                  <div key={entry.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        entry.success ? "bg-green-500/20" : "bg-red-500/20"
                      }`}>
                        {getDeviceIcon(entry.device_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {entry.browser || "Navegador desconhecido"}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                            {entry.device_type || "Desktop"}
                          </span>
                          {!entry.success && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                              Falhou
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          <span>{entry.ip_address || "IP desconhecido"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-secondary/30 rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Notificacoes por Email
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Escolha quais notificacoes deseja receber por email
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Pagamento Recebido</p>
                  <p className="text-sm text-muted-foreground">Receber email quando um pagamento for confirmado</p>
                </div>
                <Switch
                  checked={emailPrefs.payment_received}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, payment_received: v })}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Saque Aprovado</p>
                  <p className="text-sm text-muted-foreground">Receber email quando um saque for aprovado</p>
                </div>
                <Switch
                  checked={emailPrefs.withdrawal_approved}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, withdrawal_approved: v })}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Saque Recusado</p>
                  <p className="text-sm text-muted-foreground">Receber email quando um saque for recusado</p>
                </div>
                <Switch
                  checked={emailPrefs.withdrawal_rejected}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, withdrawal_rejected: v })}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Resposta do Suporte</p>
                  <p className="text-sm text-muted-foreground">Receber email quando o suporte responder seu ticket</p>
                </div>
                <Switch
                  checked={emailPrefs.ticket_response}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, ticket_response: v })}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Alerta de Login</p>
                  <p className="text-sm text-muted-foreground">Receber email quando houver login de novo dispositivo</p>
                </div>
                <Switch
                  checked={emailPrefs.login_alert}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, login_alert: v })}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-foreground">Marketing</p>
                  <p className="text-sm text-muted-foreground">Receber novidades e promocoes</p>
                </div>
                <Switch
                  checked={emailPrefs.marketing}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, marketing: v })}
                />
              </div>
            </div>

            <Button 
              onClick={handleSavePreferences} 
              disabled={savingPrefs}
              className="mt-6 gap-2"
            >
              {savingPrefs ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : prefsSaved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {prefsSaved ? "Salvo!" : "Salvar Preferencias"}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
