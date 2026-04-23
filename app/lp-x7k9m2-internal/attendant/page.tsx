"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AttendantDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingKYC: 0,
    todayNotes: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error("Error searching:", error);
    }
    
    setSearching(false);
  };

  const statCards = [
    {
      title: "Total de Usuários",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/20",
    },
    {
      title: "KYC Pendentes",
      value: stats.pendingKYC,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/20",
    },
    {
      title: "Notas Hoje",
      value: stats.todayNotes,
      icon: MessageSquare,
      color: "text-primary",
      bgColor: "bg-primary/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Painel do Atendente
        </h1>
        <p className="text-muted-foreground mt-1">
          Busque usuários e adicione notas internas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass border-border">
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
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Buscar Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Email, nome ou CPF/CNPJ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-secondary border-border"
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Resultados ({searchResults.length})
              </h3>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-xl bg-secondary border border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold">
                        {(user.name || user.email)?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {user.name || "Sem nome"}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 text-sm ${
                      user.kyc_status === "approved" ? "text-green-500" :
                      user.kyc_status === "rejected" ? "text-red-500" :
                      "text-yellow-500"
                    }`}>
                      {user.kyc_status === "approved" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : user.kyc_status === "rejected" ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      KYC
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/lp-x7k9m2-internal/attendant/users/${user.id}`}>
                        Ver Detalhes
                      </a>
                    </Button>
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
