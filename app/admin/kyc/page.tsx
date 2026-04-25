"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  UserCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Shield,
  AlertTriangle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface User {
  id: string;
  name: string;
  email: string;
  kyc_status: string;
  created_at: string;
  cpf_cnpj?: string;
}

interface KycDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: string;
  created_at: string;
}

export default function AdminKycPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "none">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approveWithoutDocs, setApproveWithoutDocs] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [filter]);

  async function loadUsers() {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin-token");
      let url = "/api/admin/users?limit=100";
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      let filteredUsers = data.users || [];
      
      // Filtrar por status KYC
      if (filter === "pending") {
        filteredUsers = filteredUsers.filter((u: User) => u.kyc_status === "pending");
      } else if (filter === "approved") {
        filteredUsers = filteredUsers.filter((u: User) => u.kyc_status === "approved");
      } else if (filter === "rejected") {
        filteredUsers = filteredUsers.filter((u: User) => u.kyc_status === "rejected");
      } else if (filter === "none") {
        filteredUsers = filteredUsers.filter((u: User) => !u.kyc_status || u.kyc_status === "not_submitted");
      }
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Erro ao carregar usuarios:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments(userId: string) {
    setLoadingDocs(true);
    try {
      const token = localStorage.getItem("admin-token");
      const response = await fetch(`/api/admin/kyc/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }

  async function handleApprove(userId: string, skipDocs: boolean = false) {
    setApproving(true);
    try {
      const token = localStorage.getItem("admin-token");
      const response = await fetch(`/api/admin/kyc/${userId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skipDocuments: skipDocs }),
      });

      if (response.ok) {
        await loadUsers();
        setSelectedUser(null);
        setShowApproveDialog(false);
        setApproveWithoutDocs(false);
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao aprovar KYC");
      }
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      alert("Erro ao aprovar KYC");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject(userId: string, reason: string) {
    try {
      const token = localStorage.getItem("admin-token");
      const response = await fetch(`/api/admin/kyc/${userId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        await loadUsers();
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.cpf_cnpj?.includes(search)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Aprovado
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
            <XCircle className="w-3 h-3" />
            Rejeitado
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Nao enviado
          </span>
        );
    }
  };

  const stats = {
    total: users.length,
    pending: users.filter((u) => u.kyc_status === "pending").length,
    approved: users.filter((u) => u.kyc_status === "approved").length,
    rejected: users.filter((u) => u.kyc_status === "rejected").length,
    none: users.filter((u) => !u.kyc_status || u.kyc_status === "not_submitted").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verificacao KYC</h1>
        <p className="text-muted-foreground">Gerencie as verificacoes de identidade dos usuarios</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
              <p className="text-xs text-muted-foreground">Aprovados</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
              <p className="text-xs text-muted-foreground">Rejeitados</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.none}</p>
              <p className="text-xs text-muted-foreground">Sem envio</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="appearance-none bg-secondary border border-border rounded-lg px-4 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
            <option value="none">Sem envio</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Users List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum usuario encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Usuario
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    CPF/CNPJ
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Data
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{user.name || "Sem nome"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground font-mono">
                        {user.cpf_cnpj || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(user.kyc_status)}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            loadDocuments(user.id);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        {user.kyc_status !== "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-500/30 text-green-500 hover:bg-green-500/10"
                            onClick={() => {
                              setSelectedUser(user);
                              setApproveWithoutDocs(!user.kyc_status || user.kyc_status === "not_submitted");
                              setShowApproveDialog(true);
                            }}
                          >
                            <Shield className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* View User Dialog */}
      <Dialog open={!!selectedUser && !showApproveDialog} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="!bg-[#1a1a1a] border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuario</DialogTitle>
            <DialogDescription>
              Informacoes de KYC de {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nome</p>
                <p className="text-sm font-medium text-foreground">{selectedUser?.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-sm font-medium text-foreground">{selectedUser?.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">CPF/CNPJ</p>
                <p className="text-sm font-medium text-foreground font-mono">
                  {selectedUser?.cpf_cnpj || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                {selectedUser && getStatusBadge(selectedUser.kyc_status)}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Documentos enviados</p>
              {loadingDocs ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : documents.length === 0 ? (
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum documento enviado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between bg-secondary/50 rounded-lg p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{doc.document_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <a
                        href={doc.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm hover:underline"
                      >
                        Ver documento
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            {selectedUser?.kyc_status !== "approved" && (
              <>
                <Button
                  variant="outline"
                  className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                  onClick={() => {
                    const reason = prompt("Motivo da rejeicao:");
                    if (reason && selectedUser) {
                      handleReject(selectedUser.id, reason);
                    }
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setApproveWithoutDocs(documents.length === 0);
                    setShowApproveDialog(true);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="!bg-[#1a1a1a] border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Aprovacao</DialogTitle>
            <DialogDescription>
              {approveWithoutDocs
                ? "Este usuario NAO enviou documentos de KYC. Deseja aprovar mesmo assim?"
                : "Deseja aprovar o KYC deste usuario?"}
            </DialogDescription>
          </DialogHeader>

          {approveWithoutDocs && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-500">Aprovacao sem documentos</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O usuario podera utilizar a plataforma sem ter enviado documentos de verificacao.
                    Use esta opcao apenas para usuarios de confianca.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Usuario</p>
            <p className="font-medium text-foreground">{selectedUser?.name || selectedUser?.email}</p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={approving}
              onClick={() => {
                if (selectedUser) {
                  handleApprove(selectedUser.id, approveWithoutDocs);
                }
              }}
            >
              {approving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Aprovando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {approveWithoutDocs ? "Aprovar sem documentos" : "Aprovar KYC"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
