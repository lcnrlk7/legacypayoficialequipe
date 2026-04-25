"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  Ban,
  MoreVertical,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface User {
  id: string;
  email: string;
  name: string | null;
  balance: number;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  api_key: string;
  cpf_cnpj: string | null;
  phone: string | null;
  kyc_status: string;
  route_type: string;
}

// Função para formatar CPF/CNPJ
function formatCPF(cpf: string | null): string {
  if (!cpf) return "-";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return cpf;
}

// Função para formatar telefone
function formatPhone(phone: string | null): string {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

interface AdminUsersContentProps {
  users: User[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

export function AdminUsersContent({ users }: AdminUsersContentProps) {
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Usuários
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os usuários da plataforma
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por email ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-border"
        />
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-12 text-center"
        >
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-medium">
            Nenhum usuário encontrado
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                    Usuário
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                    Saldo
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                    KYC
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                    Rota
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                    Cadastro
                  </th>
                  <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-bold">
                            {(user.name || user.email)[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.name || "Sem nome"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            CPF: {formatCPF(user.cpf_cnpj)} | Tel: {formatPhone(user.phone)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(user.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.kyc_status === "approved" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                          Aprovado
                        </span>
                      ) : user.kyc_status === "pending" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
                          Pendente
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                          Rejeitado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.route_type === "black" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                          Black
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                          White
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                            Inativo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Ban className="w-4 h-4 mr-2" />
                            Bloquear
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
