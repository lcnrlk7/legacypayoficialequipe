"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IntegrationError {
  id: string;
  integration_name: string;
  error_code: string;
  error_message: string;
  request_data: Record<string, unknown>;
  response_data: Record<string, unknown>;
  user_id: string;
  user_name: string;
  user_email: string;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export default function IntegrationErrorsPage() {
  const [errors, setErrors] = useState<IntegrationError[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "resolved" | "unresolved">("unresolved");
  const [integration, setIntegration] = useState<string>("all");
  const [unresolvedCount, setUnresolvedCount] = useState(0);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.set("resolved", filter === "resolved" ? "true" : "false");
      }
      if (integration !== "all") {
        params.set("integration", integration);
      }

      const token = localStorage.getItem("auth-token");
      const res = await fetch(`/api/admin/integration-errors?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.errors) {
        setErrors(data.errors);
        setUnresolvedCount(data.unresolvedCount || 0);
      }
    } catch (error) {
      console.error("Error fetching errors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, [filter, integration]);

  const markAsResolved = async (errorId: string) => {
    try {
      const token = localStorage.getItem("auth-token");
      await fetch("/api/admin/integration-errors", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ errorId, resolved: true }),
      });
      fetchErrors();
    } catch (error) {
      console.error("Error marking as resolved:", error);
    }
  };

  const getIntegrationColor = (name: string) => {
    switch (name) {
      case "promissepay":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "misticpay":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            Erros de Integração
            {unresolvedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unresolvedCount} não resolvidos
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Monitore erros das integrações com adquirentes
          </p>
        </div>
        <Button onClick={fetchErrors} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unresolved">Não Resolvidos</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={integration} onValueChange={setIntegration}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por integração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Integrações</SelectItem>
                <SelectItem value="promissepay">Promisse Pay</SelectItem>
                <SelectItem value="misticpay">MisticPay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">Nenhum erro encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Integração</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell>
                      <Badge className={getIntegrationColor(error.integration_name)}>
                        {error.integration_name === "promissepay"
                          ? "Promisse Pay"
                          : error.integration_name === "misticpay"
                          ? "MisticPay"
                          : error.integration_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {error.error_code}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {error.error_message}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{error.user_name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{error.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(error.created_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      {error.resolved ? (
                        <Badge variant="outline" className="text-green-500 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolvido
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!error.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsResolved(error.id)}
                        >
                          Resolver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
