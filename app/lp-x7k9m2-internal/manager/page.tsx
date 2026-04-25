"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  FileCheck,
  Banknote,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ManagerDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingKYC: 0,
    pendingWithdrawals: 0,
    todayVolume: 0,
  });
  const [recentKYC, setRecentKYC] = useState<any[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch("/api/admin/manager/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {
          totalUsers: 0,
          pendingKYC: 0,
          pendingWithdrawals: 0,
          todayVolume: 0,
        });
        setRecentKYC(data.recentKYC || []);
        setRecentWithdrawals(data.recentWithdrawals || []);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
    setLoading(false);
  };

  const statCards = [
    {
      title: "Usuários Totais",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/20",
    },
    {
      title: "KYC Pendentes",
      value: stats.pendingKYC,
      icon: FileCheck,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/20",
      href: "/lp-x7k9m2-internal/manager/kyc",
    },
    {
      title: "Saques Pendentes",
      value: stats.pendingWithdrawals,
      icon: Banknote,
      color: "text-primary",
      bgColor: "bg-primary/20",
      href: "/lp-x7k9m2-internal/manager/withdrawals",
    },
    {
      title: "Volume Hoje",
      value: `R$ ${stats.todayVolume.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/20",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Painel do Gerente
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie KYC, saques e monitore transações
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass border-border hover:border-border transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                {stat.href && (
                  <Link href={stat.href} className="mt-4 flex items-center gap-1 text-sm text-primary hover:underline">
                    Ver todos <ArrowUpRight className="w-4 h-4" />
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending KYC */}
        <Card className="glass border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-yellow-500" />
              KYC Pendentes
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/lp-x7k9m2-internal/manager/kyc">Ver Todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentKYC.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhum KYC pendente
              </p>
            ) : (
              <div className="space-y-3">
                {recentKYC.map((doc: any) => (
                  <div key={doc.id} className="p-3 rounded-xl bg-secondary flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {doc.name || doc.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {doc.document_type === "identity" ? "Identidade" :
                         doc.document_type === "address_proof" ? "Comprovante" : "Selfie"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-yellow-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Pendente</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Withdrawals */}
        <Card className="glass border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-primary" />
              Saques Pendentes
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/lp-x7k9m2-internal/manager/withdrawals">Ver Todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentWithdrawals.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhum saque pendente
              </p>
            ) : (
              <div className="space-y-3">
                {recentWithdrawals.map((withdrawal: any) => (
                  <div key={withdrawal.id} className="p-3 rounded-xl bg-secondary flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {withdrawal.name || withdrawal.email}
                      </p>
                      <p className="text-sm text-primary font-medium">
                        R$ {Number(withdrawal.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-yellow-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Pendente</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
