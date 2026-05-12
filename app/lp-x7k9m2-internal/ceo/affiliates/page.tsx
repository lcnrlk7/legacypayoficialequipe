"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Loader2,
  Award,
  CreditCard,
  CheckCircle,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  referral_code: string;
  created_at: string;
  total_referrals: number;
  total_commissions: number;
  pending_commissions: number;
  paid_commissions: number;
}

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  affiliate_name: string;
  affiliate_email: string;
  referred_user_name: string;
  transaction_amount: number;
}

interface TopAffiliate {
  id: string;
  name: string;
  email: string;
  total_referrals: number;
  total_earned: number;
}

interface Stats {
  total_affiliates: number;
  total_commissions: number;
  total_paid: number;
  pending_total: number;
}

export default function AdminAffiliatesPage() {
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [recentCommissions, setRecentCommissions] = useState<Commission[]>([]);
  const [topAffiliates, setTopAffiliates] = useState<TopAffiliate[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_affiliates: 0,
    total_commissions: 0,
    total_paid: 0,
    pending_total: 0
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const response = await fetch("/api/admin/affiliates");
      const data = await response.json();

      if (response.ok) {
        setAffiliates(data.affiliates || []);
        setRecentCommissions(data.recentCommissions || []);
        setTopAffiliates(data.topAffiliates || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function payCommissions(affiliateId: string) {
    setPaying(affiliateId);
    try {
      const response = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId, action: "pay_all" })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        loadData();
      } else {
        alert(data.error || "Erro ao pagar comissoes");
      }
    } catch (error) {
      console.error("Erro ao pagar:", error);
      alert("Erro ao processar pagamento");
    } finally {
      setPaying(null);
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  const filteredAffiliates = affiliates.filter(
    (a) =>
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gerenciar Afiliados</h1>
        <p className="text-muted-foreground mt-1">
          Visualize e gerencie o programa de afiliados
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">Afiliados Ativos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total_affiliates}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="text-xs text-muted-foreground">Total Comissoes</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total_commissions}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-xs text-muted-foreground">Total Pago</span>
          </div>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.total_paid)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Pendente</span>
          </div>
          <p className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.pending_total)}</p>
        </motion.div>
      </div>

      {/* Top Affiliates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Top Afiliados</h3>
        </div>
        
        {topAffiliates.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhum afiliado ainda</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {topAffiliates.map((affiliate, index) => (
              <div
                key={affiliate.id}
                className="bg-secondary rounded-xl p-4 text-center"
              >
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                  index === 1 ? "bg-gray-400/20 text-gray-400" :
                  index === 2 ? "bg-orange-600/20 text-orange-600" :
                  "bg-primary/20 text-primary"
                }`}>
                  <span className="font-bold text-sm">{index + 1}</span>
                </div>
                <p className="font-medium text-foreground truncate">{affiliate.name || "Usuario"}</p>
                <p className="text-xs text-muted-foreground truncate">{affiliate.email}</p>
                <p className="text-sm font-bold text-primary mt-2">
                  {formatCurrency(affiliate.total_earned)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {affiliate.total_referrals} indicados
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Affiliates List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-foreground">Todos os Afiliados</h3>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar afiliado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-secondary"
            />
          </div>
        </div>
        
        {filteredAffiliates.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum afiliado encontrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-xs text-muted-foreground font-medium">Afiliado</th>
                  <th className="text-left py-3 px-2 text-xs text-muted-foreground font-medium">Codigo</th>
                  <th className="text-center py-3 px-2 text-xs text-muted-foreground font-medium">Indicados</th>
                  <th className="text-right py-3 px-2 text-xs text-muted-foreground font-medium">Total</th>
                  <th className="text-right py-3 px-2 text-xs text-muted-foreground font-medium">Pendente</th>
                  <th className="text-right py-3 px-2 text-xs text-muted-foreground font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredAffiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="border-b border-border/50">
                    <td className="py-3 px-2">
                      <p className="font-medium text-foreground">{affiliate.name || "Usuario"}</p>
                      <p className="text-xs text-muted-foreground">{affiliate.email}</p>
                    </td>
                    <td className="py-3 px-2">
                      <code className="text-xs bg-secondary px-2 py-1 rounded">
                        {affiliate.referral_code}
                      </code>
                    </td>
                    <td className="py-3 px-2 text-center text-sm text-foreground">
                      {affiliate.total_referrals}
                    </td>
                    <td className="py-3 px-2 text-right text-sm font-medium text-green-500">
                      {formatCurrency(affiliate.total_commissions)}
                    </td>
                    <td className="py-3 px-2 text-right text-sm font-medium text-yellow-500">
                      {formatCurrency(affiliate.pending_commissions)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {affiliate.pending_commissions > 0 && (
                        <Button
                          size="sm"
                          onClick={() => payCommissions(affiliate.id)}
                          disabled={paying === affiliate.id}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {paying === affiliate.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-1" />
                              Pagar
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Recent Commissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Comissoes Recentes</h3>
        
        {recentCommissions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma comissao ainda</p>
        ) : (
          <div className="space-y-3">
            {recentCommissions.slice(0, 10).map((commission) => (
              <div
                key={commission.id}
                className="flex items-center justify-between p-3 bg-secondary rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    commission.status === "paid" ? "bg-green-500" : "bg-yellow-500"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {commission.affiliate_name || "Afiliado"} 
                      <span className="text-muted-foreground"> indicou </span>
                      {commission.referred_user_name || "Usuario"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Transacao de {formatCurrency(commission.transaction_amount || 0)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-green-500">
                      +{formatCurrency(commission.amount)}
                    </p>
                    {commission.status === "paid" && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(commission.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
