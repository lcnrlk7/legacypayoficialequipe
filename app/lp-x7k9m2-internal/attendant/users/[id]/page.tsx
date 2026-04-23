"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Wallet,
  FileCheck,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  balance: number;
  kyc_status: string;
  route_type: 'white' | 'black';
  daily_limit: number;
  fee_percentage: number;
  created_at: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingRoute, setUpdatingRoute] = useState(false);

  const handleUpdateRouteType = async (routeType: 'white' | 'black') => {
    if (!user) return;
    setUpdatingRoute(true);
    try {
      await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "update",
          data: { route_type: routeType }
        })
      });
      setUser({ ...user, route_type: routeType });
    } catch (error) {
      console.error("Error updating route:", error);
    }
    setUpdatingRoute(false);
  };

  useEffect(() => {
    loadUserData();
  }, [params.id]);

  const loadUserData = async () => {
    try {
      const res = await fetch(`/api/admin/users?id=${params.id}`);
      const profile = await res.json();
      setUser(profile);
    } catch (error) {
      console.error("Error loading user:", error);
    }
    setLoading(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setSubmitting(true);
    // Note: internal_notes table needs to be created for this to work
    // For now, just clear the input
    setNewNote("");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {user.name || "Usuário"}
          </h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informações do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <p className="font-medium text-foreground">{user.email}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </div>
                  <p className="font-medium text-foreground">{user.phone || "Não informado"}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Wallet className="w-4 h-4" />
                    Saldo
                  </div>
                  <p className="font-medium text-foreground">
                    R$ {(Number(user.balance) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-secondary">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Cadastro
                  </div>
                  <p className="font-medium text-foreground">
                    {new Date(user.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                  user.kyc_status === "approved" ? "bg-green-500/20 text-green-500" :
                  user.kyc_status === "rejected" ? "bg-red-500/20 text-red-500" :
                  "bg-yellow-500/20 text-yellow-500"
                }`}>
                  {user.kyc_status === "approved" ? <CheckCircle2 className="w-4 h-4" /> :
                   user.kyc_status === "rejected" ? <XCircle className="w-4 h-4" /> :
                   <Clock className="w-4 h-4" />}
                  KYC: {user.kyc_status === "approved" ? "Aprovado" : 
                        user.kyc_status === "rejected" ? "Rejeitado" : "Pendente"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Configuration */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Configuracao de Rota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione a rota de processamento para este usuario:
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleUpdateRouteType('white')}
                    disabled={updatingRoute}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      user.route_type === 'white' 
                        ? 'border-green-500 bg-green-500/20' 
                        : 'border-border bg-secondary hover:border-green-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">Rota White</span>
                      {user.route_type === 'white' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gateway Premium - Menor taxa
                    </p>
                  </button>
                  <button
                    onClick={() => handleUpdateRouteType('black')}
                    disabled={updatingRoute}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      user.route_type === 'black' 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-border bg-secondary hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">Rota Black</span>
                      {user.route_type === 'black' && (
                        <CheckCircle2 className="w-5 h-5 text-purple-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gateway Express - Padrao
                    </p>
                  </button>
                </div>
                {updatingRoute && (
                  <div className="flex items-center justify-center py-2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">Atualizando...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Note */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Adicionar Nota Interna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Escreva uma nota sobre este usuário..."
                  className="w-full h-24 p-4 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary"
                />
                <Button onClick={handleAddNote} disabled={submitting || !newNote.trim()}>
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Adicionar Nota
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes History */}
        <div>
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                Histórico de Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Nenhuma nota registrada
                </p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-xl bg-secondary border border-border">
                      <p className="text-foreground text-sm">{note.content}</p>
                      <p className="text-muted-foreground text-xs mt-2">
                        {new Date(note.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
