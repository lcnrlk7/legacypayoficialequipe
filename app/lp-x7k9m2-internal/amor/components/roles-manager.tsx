"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Role {
  id: string;
  role: string;
  permissions: string[];
  description: string;
  created_at: string;
}

export function RolesManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRole, setNewRole] = useState("");
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [newDescription, setNewDescription] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/admin/superadmin/roles");
      const data = await response.json();
      setRoles(data.roles || []);
    } catch (error) {
      console.error("[v0] Error fetching roles:", error);
      toast.error("Erro ao carregar roles");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.trim()) {
      toast.error("Nome da role é obrigatório");
      return;
    }

    try {
      const response = await fetch("/api/admin/superadmin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: newRole,
          permissions: newPermissions,
          description: newDescription
        })
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Erro ao criar role");
        return;
      }

      toast.success("Role criada com sucesso");
      setNewRole("");
      setNewPermissions([]);
      setNewDescription("");
      setOpen(false);
      await fetchRoles();
    } catch (error) {
      console.error("[v0] Error creating role:", error);
      toast.error("Erro ao criar role");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando roles...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciador de Roles</CardTitle>
          <CardDescription>Controle as permissões por função</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome da Role</label>
                <Input
                  placeholder="ex: moderator"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  placeholder="ex: Moderador de conteúdo"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleCreateRole} className="w-full">
                Criar Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{role.role}</h4>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {role.permissions?.length || 0} perms
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
