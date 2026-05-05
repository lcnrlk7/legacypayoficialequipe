"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  ArrowLeftRight,
  Wallet,
  Settings,
  Server,
  LogOut,
  Menu,
  X,
  Shield,
  UserCog,
  Bell,
  BellRing,
  Activity,
  Gift,
  Percent,
  FileBarChart,
  UsersRound,
  Webhook,
  Clock,
  DollarSign,
} from "lucide-react";

// Menu organizado em categorias
const menuCategories = [
  {
    title: "Visao Geral",
    items: [
      { label: "Dashboard", href: "/lp-x7k9m2-internal/ceo", icon: LayoutDashboard },
      { label: "Relatorios", href: "/lp-x7k9m2-internal/ceo/reports", icon: FileBarChart },
    ],
  },
  {
    title: "Usuarios & Equipe",
    items: [
      { label: "Usuarios", href: "/lp-x7k9m2-internal/ceo/users", icon: Users },
      { label: "Equipe", href: "/lp-x7k9m2-internal/ceo/team", icon: UserCog },
      { label: "KYC", href: "/lp-x7k9m2-internal/ceo/kyc", icon: FileCheck },
      { label: "Afiliados", href: "/lp-x7k9m2-internal/ceo/affiliates", icon: UsersRound },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { label: "Dashboard Financeiro", href: "/lp-x7k9m2-internal/ceo/financial", icon: DollarSign },
      { label: "Transacoes", href: "/lp-x7k9m2-internal/ceo/transactions", icon: ArrowLeftRight },
      { label: "Saques", href: "/lp-x7k9m2-internal/ceo/withdrawals", icon: Wallet },
      { label: "Taxas", href: "/lp-x7k9m2-internal/ceo/fees", icon: Percent },
    ],
  },
  {
    title: "Engajamento",
    items: [
      { label: "Premiacoes", href: "/lp-x7k9m2-internal/ceo/rewards", icon: Gift },
      { label: "Notificacoes", href: "/lp-x7k9m2-internal/ceo/notifications", icon: Bell },
      { label: "Push Notifications", href: "/lp-x7k9m2-internal/ceo/push", icon: BellRing },
    ],
  },
  {
    title: "Sistema",
    items: [
      { label: "Webhooks", href: "/lp-x7k9m2-internal/ceo/webhooks", icon: Webhook },
      { label: "Logs", href: "/lp-x7k9m2-internal/ceo/logs", icon: Activity },
      { label: "Ataques", href: "/lp-x7k9m2-internal/ceo/attacks", icon: Shield },
      { label: "Adquirentes", href: "/lp-x7k9m2-internal/ceo/acquirers", icon: Server },
      { label: "Configuracoes", href: "/lp-x7k9m2-internal/ceo/settings", icon: Settings },
    ],
  },
];

export default function CEOLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [sessionTimeLeft, setSessionTimeLeft] = useState<string>("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Funcao para calcular tempo restante da sessao
  const calculateTimeLeft = useCallback(() => {
    if (typeof window === 'undefined') return "24h 00m";
    
    let loginTime = localStorage.getItem("lp_admin_login_time");
    
    // Se nao existe, criar agora
    if (!loginTime) {
      const now = Date.now().toString();
      localStorage.setItem("lp_admin_login_time", now);
      loginTime = now;
    }
    
    const loginTimestamp = parseInt(loginTime);
    const now = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 horas em ms
    const timeLeft = loginTimestamp + sessionDuration - now;
    
    if (timeLeft <= 0) {
      setSessionExpired(true);
      return "Expirada";
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("lp_admin_session");
    const user = localStorage.getItem("lp_admin_user");
    const role = localStorage.getItem("lp_admin_role");

    if (!token || !user || role !== "ceo") {
      router.push("/lp-x7k9m2-internal");
    } else {
      setIsAuthenticated(true);
      setAdminUser(user);
      
      // Salvar tempo de login se nao existir
      if (!localStorage.getItem("lp_admin_login_time")) {
        localStorage.setItem("lp_admin_login_time", Date.now().toString());
      }
    }
    setIsLoading(false);
  }, [router]);

  // Atualizar timer a cada segundo
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      setSessionTimeLeft(timeLeft);
      
      // Se sessao expirou, redirecionar
      if (sessionExpired) {
        handleLogout();
      }
    }, 1000);
    
    // Calcular imediatamente
    setSessionTimeLeft(calculateTimeLeft());
    
    return () => clearInterval(interval);
  }, [isAuthenticated, calculateTimeLeft, sessionExpired]);

  const handleLogout = () => {
    localStorage.removeItem("lp_admin_session");
    localStorage.removeItem("lp_admin_user");
    localStorage.removeItem("lp_admin_role");
    localStorage.removeItem("lp_admin_login_time");
    router.push("/lp-x7k9m2-internal");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo-icon.png" alt="LegacyPay" width={32} height={32} />
          <span className="font-semibold text-foreground">Admin CEO</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Timer Mobile */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Clock className="w-3 h-3 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-400">{sessionTimeLeft || "24h 00m"}</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:min-h-screen bg-card border-r border-border sticky top-0">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-icon.png"
                alt="LegacyPay"
                width={36}
                height={36}
              />
              <div>
                <div className="flex items-baseline">
                  <span className="font-bold text-foreground">Legacy</span>
                  <span className="font-bold text-primary">Pay</span>
                </div>
                <span className="text-xs text-muted-foreground">Painel CEO</span>
              </div>
            </div>
            
            {/* Timer de Sessao - TOPO */}
            <div className="flex items-center gap-2 px-3 py-2 mt-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Clock className="w-4 h-4 text-yellow-500" />
              <div className="flex-1">
                <p className="text-[10px] text-yellow-500">Sessao expira em</p>
                <p className="text-sm font-bold text-yellow-400">{sessionTimeLeft || "24h 00m"}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuCategories.map((category, categoryIndex) => (
              <div key={category.title} className={categoryIndex > 0 ? "pt-4" : ""}>
                <div className="pb-2">
                  <span className="px-4 text-xs text-muted-foreground uppercase tracking-wider">
                    {category.title}
                  </span>
                </div>
                {category.items.map((item) => {
                  const isActive = item.href === "/lp-x7k9m2-internal/ceo" 
                    ? pathname === item.href 
                    : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground capitalize">
                  {adminUser}
                </p>
                <p className="text-xs text-muted-foreground">CEO / Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-overlay z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25 }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-card z-50 lg:hidden flex flex-col"
              >
                <div className="p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/logo-icon.png"
                      alt="LegacyPay"
                      width={36}
                      height={36}
                    />
                    <div>
                      <div className="flex items-baseline">
                        <span className="font-bold text-foreground">Legacy</span>
                        <span className="font-bold text-primary">Pay</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Painel CEO
                      </span>
                    </div>
                  </div>
                  
                  {/* Timer de Sessao Mobile - TOPO */}
                  <div className="flex items-center gap-2 px-3 py-2 mt-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-[10px] text-yellow-500">Sessao expira em</p>
                      <p className="text-sm font-bold text-yellow-400">{sessionTimeLeft || "24h 00m"}</p>
                    </div>
                  </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                  {menuCategories.map((category, categoryIndex) => (
                    <div key={category.title} className={categoryIndex > 0 ? "pt-4" : ""}>
                      <div className="pb-2">
                        <span className="px-4 text-xs text-muted-foreground uppercase tracking-wider">
                          {category.title}
                        </span>
                      </div>
                      {category.items.map((item) => {
                        const isActive = item.href === "/lp-x7k9m2-internal/ceo" 
                          ? pathname === item.href 
                          : pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium text-sm">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </nav>

                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {adminUser}
                      </p>
                      <p className="text-xs text-muted-foreground">CEO / Admin</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sair</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-h-screen p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
