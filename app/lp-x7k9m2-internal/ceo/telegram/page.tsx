"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Settings, 
  Users, 
  MessageSquare, 
  Bell, 
  Megaphone,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Unlink,
  Bot
} from "lucide-react";
import { toast } from "sonner";

interface TelegramSettings {
  bot_enabled: boolean;
  sales_channel_id: string | null;
  announcements_channel_id: string | null;
  support_group_id: string | null;
  notify_deposits: boolean;
  notify_withdrawals: boolean;
}

interface TelegramUser {
  id: string;
  user_id: string;
  telegram_id: string;
  telegram_username: string | null;
  telegram_first_name: string | null;
  is_active: boolean;
  created_at: string;
  user_name: string;
  user_email: string;
}

export default function TelegramPage() {
  const [settings, setSettings] = useState<TelegramSettings>({
    bot_enabled: true,
    sales_channel_id: null,
    announcements_channel_id: null,
    support_group_id: null,
    notify_deposits: true,
    notify_withdrawals: true,
  });
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingUpWebhook, setSettingUpWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  
  // Formulario de aviso
  const [announcement, setAnnouncement] = useState("");
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  // Formulario de canais
  const [salesChannelInput, setSalesChannelInput] = useState("");
  const [announcementsChannelInput, setAnnouncementsChannelInput] = useState("");
  const [supportGroupInput, setSupportGroupInput] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/telegram/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || settings);
        setUsers(data.users || []);
        setSalesChannelInput(data.settings?.sales_channel_id || "");
        setAnnouncementsChannelInput(data.settings?.announcements_channel_id || "");
        setSupportGroupInput(data.settings?.support_group_id || "");
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupWebhook = async () => {
    try {
      setSettingUpWebhook(true);
      const res = await fetch("/api/telegram/setup", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        setWebhookStatus("Webhook configurado com sucesso!");
        toast.success("Webhook configurado!");
      } else {
        setWebhookStatus("Erro: " + data.error);
        toast.error("Erro ao configurar webhook");
      }
    } catch (error) {
      toast.error("Erro ao configurar webhook");
    } finally {
      setSettingUpWebhook(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/telegram/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          sales_channel_id: salesChannelInput || null,
          announcements_channel_id: announcementsChannelInput || null,
          support_group_id: supportGroupInput || null,
        }),
      });
      
      if (res.ok) {
        toast.success("Configuracoes salvas!");
        loadData();
      } else {
        toast.error("Erro ao salvar");
      }
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const sendAnnouncement = async () => {
    if (!announcement.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }
    
    try {
      setSendingAnnouncement(true);
      const res = await fetch("/api/telegram/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: announcement }),
      });
      
      if (res.ok) {
        toast.success("Aviso enviado para o canal!");
        setAnnouncement("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao enviar");
      }
    } catch (error) {
      toast.error("Erro ao enviar aviso");
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const unlinkUser = async (telegramUserId: string) => {
    if (!confirm("Tem certeza que deseja desvincular este usuario?")) return;
    
    try {
      const res = await fetch(`/api/telegram/users/${telegramUserId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        toast.success("Usuario desvinculado");
        loadData();
      } else {
        toast.error("Erro ao desvincular");
      }
    } catch (error) {
      toast.error("Erro ao desvincular");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-7 h-7 text-primary" />
            Bot Telegram
          </h1>
          <p className="text-muted-foreground">
            Gerencie o bot, canais e usuarios vinculados
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuracao do Webhook */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuracao do Bot
            </CardTitle>
            <CardDescription>
              Configure o webhook para o bot funcionar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Status do Bot</p>
                <p className="text-sm text-muted-foreground">
                  {settings.bot_enabled ? "Ativado" : "Desativado"}
                </p>
              </div>
              <Switch
                checked={settings.bot_enabled}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, bot_enabled: checked })
                }
              />
            </div>

            <Button 
              onClick={setupWebhook} 
              disabled={settingUpWebhook}
              className="w-full"
            >
              {settingUpWebhook ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Configurar Webhook
            </Button>

            {webhookStatus && (
              <p className={`text-sm p-2 rounded ${
                webhookStatus.includes("sucesso") 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              }`}>
                {webhookStatus}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Configuracao dos Canais */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Canais e Grupos
            </CardTitle>
            <CardDescription>
              Configure os IDs dos canais do Telegram
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Canal de Vendas (mostrar transacoes)</Label>
              <Input
                placeholder="@canal ou -1001234567890"
                value={salesChannelInput}
                onChange={(e) => setSalesChannelInput(e.target.value)}
              />
            </div>

            <div>
              <Label>Canal de Avisos</Label>
              <Input
                placeholder="@canal ou -1001234567890"
                value={announcementsChannelInput}
                onChange={(e) => setAnnouncementsChannelInput(e.target.value)}
              />
            </div>

            <div>
              <Label>Grupo de Suporte (opcional)</Label>
              <Input
                placeholder="-1001234567890"
                value={supportGroupInput}
                onChange={(e) => setSupportGroupInput(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.notify_deposits}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, notify_deposits: checked })
                  }
                />
                <Label>Notificar depositos</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.notify_withdrawals}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, notify_withdrawals: checked })
                  }
                />
                <Label>Notificar saques</Label>
              </div>
            </div>

            <Button onClick={saveSettings} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Salvar Configuracoes
            </Button>
          </CardContent>
        </Card>

        {/* Enviar Aviso */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Enviar Aviso
            </CardTitle>
            <CardDescription>
              Envie um aviso para o canal de comunicados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Digite o aviso que sera enviado para o canal..."
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              rows={4}
            />
            <Button 
              onClick={sendAnnouncement} 
              disabled={sendingAnnouncement || !announcementsChannelInput}
              className="w-full"
            >
              {sendingAnnouncement ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar para o Canal
            </Button>
            {!announcementsChannelInput && (
              <p className="text-sm text-yellow-400">
                Configure o canal de avisos primeiro
              </p>
            )}
          </CardContent>
        </Card>

        {/* Estatisticas */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Estatisticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold text-primary">{users.length}</p>
                <p className="text-sm text-muted-foreground">Usuarios Vinculados</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold text-green-400">
                  {users.filter(u => u.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuarios Vinculados */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuarios Vinculados ao Bot
          </CardTitle>
          <CardDescription>
            Usuarios que conectaram suas contas ao Telegram
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum usuario vinculado ainda</p>
              <p className="text-sm">Os usuarios podem vincular usando /start no bot</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-muted-foreground font-medium">Usuario</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Telegram</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Vinculado em</th>
                    <th className="text-right p-3 text-muted-foreground font-medium">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3">
                        <p className="font-medium">{user.user_name || "Sem nome"}</p>
                        <p className="text-sm text-muted-foreground">{user.user_email}</p>
                      </td>
                      <td className="p-3">
                        {user.telegram_username ? (
                          <span className="text-primary">@{user.telegram_username}</span>
                        ) : (
                          <span className="text-muted-foreground">{user.telegram_first_name || user.telegram_id}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unlinkUser(user.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Unlink className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
