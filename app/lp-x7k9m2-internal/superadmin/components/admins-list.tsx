"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Admin {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  action_count: number;
  last_action_at: string;
}

interface CredentialsData {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: string;
  password: string;
}

export function AdminsList() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<CredentialsData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await fetch("/api/admin/superadmin/admins");
        const data = await response.json();
        setAdmins(data.admins || []);
      } catch (error) {
        console.error("[v0] Error fetching admins:", error);
        toast.error("Erro ao carregar administradores");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const handleViewCredentials = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/superadmin/admin-credentials?userId=${userId}`);
      const data = await response.json();
      if (response.ok) {
        setCredentials(data);
      } else {
        toast.error(data.error || "Erro ao carregar credenciais");
      }
    } catch (error) {
      console.error("[v0] Error fetching credentials:", error);
      toast.error("Erro ao carregar credenciais");
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para área de transferência`);
  };

  if (loading) {
    return <div className="text-center py-8">Carregando administradores...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administradores</CardTitle>
        <CardDescription>Todos os membros da equipe de administração</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-sm">Nome</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Ações</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Última Ação</th>
                <th className="text-right py-3 px-4 font-semibold text-sm">Credenciais</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 text-sm">{admin.name}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{admin.email}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="inline-block px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                      {admin.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      admin.is_active 
                        ? "bg-green-500/10 text-green-700" 
                        : "bg-red-500/10 text-red-700"
                    }`}>
                      {admin.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{admin.action_count}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {admin.last_action_at 
                      ? new Date(admin.last_action_at).toLocaleString('pt-BR')
                      : "Nunca"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Dialog open={open && credentials?.user_id === admin.user_id} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewCredentials(admin.user_id)}
                        >
                          Ver
                        </Button>
                      </DialogTrigger>
                      {credentials && credentials.user_id === admin.user_id && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Credenciais de {credentials.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Email</label>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  value={credentials.email}
                                  readOnly
                                  className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopy(credentials.email, "Email")}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Senha</label>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={credentials.password}
                                  readOnly
                                  className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopy(credentials.password, "Senha")}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
