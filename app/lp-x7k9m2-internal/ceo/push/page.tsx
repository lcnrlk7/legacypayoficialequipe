"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Bell, Send, Trash2, Plus, Loader2, CheckCircle, 
  AlertTriangle, Users, MessageSquare, Sparkles, History
} from "lucide-react";
import { motion } from "framer-motion";

interface MotivationalMessage {
  id: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

interface PushHistoryItem {
  id: string;
  title: string;
  body: string;
  type: string;
  sent_count: number;
  sent_at: string;
}

export default function AdminPushPage() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [addingMessage, setAddingMessage] = useState(false);
  const [motivationalMessages, setMotivationalMessages] = useState<MotivationalMessage[]>([]);
  const [pushHistory, setPushHistory] = useState<PushHistoryItem[]>([]);
  const [pushActiveUsers, setPushActiveUsers] = useState(0);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [newMotivational, setNewMotivational] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();
      
      setMotivationalMessages(data.motivationalMessages || []);
      setPushHistory(data.pushHistory || []);
      setPushActiveUsers(data.pushActiveUsers || 0);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMotivationalPush() {
    setSending(true);
    setFeedback(null);
    
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_motivational_push" })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setFeedback({ type: "success", text: data.message });
        loadData();
      } else {
        setFeedback({ type: "error", text: data.error || "Erro ao enviar" });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro de conexao" });
    } finally {
      setSending(false);
    }
  }

  async function sendCustomPush() {
    if (!customTitle.trim() || !customMessage.trim()) {
      setFeedback({ type: "error", text: "Preencha titulo e mensagem" });
      return;
    }

    setSending(true);
    setFeedback(null);
    
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "send_push_all",
          title: customTitle,
          message: customMessage,
          type: "announcement"
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setFeedback({ type: "success", text: data.message });
        setCustomTitle("");
        setCustomMessage("");
        loadData();
      } else {
        setFeedback({ type: "error", text: data.error || "Erro ao enviar" });
      }
    } catch {
      setFeedback({ type: "error", text: "Erro de conexao" });
    } finally {
      setSending(false);
    }
  }

  async function addMotivationalMessage() {
    if (!newMotivational.trim()) return;

    setAddingMessage(true);
    
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "add_motivational",
          message: newMotivational
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setNewMotivational("");
        loadData();
      }
    } catch {
      console.error("Erro ao adicionar");
    } finally {
      setAddingMessage(false);
    }
  }

  async function deleteMotivationalMessage(id: string) {
    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_motivational", id })
      });
      loadData();
    } catch {
      console.error("Erro ao deletar");
    }
  }

  async function toggleMotivationalMessage(id: string, is_active: boolean) {
    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_motivational", id, is_active: !is_active })
      });
      loadData();
    } catch {
      console.error("Erro ao alterar");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificacoes Push</h1>
          <p className="text-muted-foreground">Envie notificacoes para todos os usuarios</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
          <Users className="w-5 h-5 text-primary" />
          <span className="font-semibold text-primary">{pushActiveUsers}</span>
          <span className="text-sm text-muted-foreground">usuarios com push ativo</span>
        </div>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-2 ${
            feedback.type === "success" 
              ? "bg-green-500/10 border border-green-500/20 text-green-500" 
              : "bg-destructive/10 border border-destructive/20 text-destructive"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {feedback.text}
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Enviar Push Customizado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Enviar Push Customizado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Titulo</label>
              <Input
                placeholder="Ex: Novidade no LegacyPay!"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Mensagem</label>
              <Textarea
                placeholder="Ex: Confira as novas funcionalidades..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              onClick={sendCustomPush} 
              disabled={sending || !customTitle || !customMessage}
              className="w-full"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar para Todos
            </Button>
          </CardContent>
        </Card>

        {/* Enviar Mensagem Motivacional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Mensagem Motivacional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envia uma mensagem motivacional aleatoria da lista abaixo para todos os usuarios com push ativo.
            </p>
            <Button 
              onClick={sendMotivationalPush} 
              disabled={sending || motivationalMessages.length === 0}
              variant="outline"
              className="w-full"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Enviar Motivacional Aleatorio
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {motivationalMessages.filter(m => m.is_active).length} mensagens ativas disponiveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mensagens Motivacionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Mensagens Motivacionais ({motivationalMessages.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Adicionar nova */}
          <div className="flex gap-2">
            <Input
              placeholder="Digite uma nova mensagem motivacional..."
              value={newMotivational}
              onChange={(e) => setNewMotivational(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMotivationalMessage()}
            />
            <Button onClick={addMotivationalMessage} disabled={addingMessage || !newMotivational.trim()}>
              {addingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>

          {/* Lista de mensagens */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {motivationalMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  msg.is_active ? "bg-secondary/50" : "bg-secondary/20 opacity-60"
                }`}
              >
                <p className="text-sm text-foreground flex-1 pr-4">{msg.message}</p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleMotivationalMessage(msg.id, msg.is_active)}
                  >
                    {msg.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteMotivationalMessage(msg.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historico de Push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historico de Envios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pushHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum push enviado ainda
            </p>
          ) : (
            <div className="space-y-2">
              {pushHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">{item.sent_count} enviados</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.sent_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
