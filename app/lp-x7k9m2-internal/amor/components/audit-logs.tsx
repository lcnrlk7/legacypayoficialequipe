"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  actor_name: string;
  action: string;
  target_id: string;
  details: string;
  created_at: string;
}

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const fetchLogs = async () => {
    try {
      const url = new URL("/api/admin/superadmin/audit-logs", window.location.origin);
      if (actionFilter) url.searchParams.append("action", actionFilter);
      url.searchParams.append("limit", "100");

      const response = await fetch(url);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("[v0] Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    filter === "" || 
    log.actor_email?.toLowerCase().includes(filter.toLowerCase()) ||
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.details?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Carregando logs de auditoria...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de Auditoria</CardTitle>
        <CardDescription>Registro de todas as ações administrativas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Filtrar por email, ação ou detalhes..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas as ações" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as ações</SelectItem>
              <SelectItem value="VIEW_CREDENTIALS">Ver Credenciais</SelectItem>
              <SelectItem value="CREATE_ROLE">Criar Role</SelectItem>
              <SelectItem value="UPDATE_ROLE">Atualizar Role</SelectItem>
              <SelectItem value="DELETE_ROLE">Deletar Role</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-sm">Admin</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Ação</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Detalhes</th>
                <th className="text-right py-3 px-4 font-semibold text-sm">Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 text-sm">
                    <div>
                      <p className="font-medium">{log.actor_name}</p>
                      <p className="text-xs text-muted-foreground">{log.actor_email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{log.details}</td>
                  <td className="py-3 px-4 text-sm text-right text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum log encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
