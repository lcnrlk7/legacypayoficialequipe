"use client";

import { useEffect, useState } from "react";
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
  Activity,
  Gift,
  Percent,
  FileBarChart,
  UsersRound,
  Webhook,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/lp-x7k9m2-internal/ceo",
    icon: LayoutDashboard,
  },
  {
    label: "Usuários",
    href: "/lp-x7k9m2-internal/ceo/users",
    icon: Users,
  },
  {
    label: "Equipe",
    href: "/lp-x7k9m2-internal/ceo/team",
    icon: UserCog,
  },
  {
    label: "KYC",
    href: "/lp-x7k9m2-internal/ceo/kyc",
    icon: FileCheck,
  },
  {
    label: "Transações",
    href: "/lp-x7k9m2-internal/ceo/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Saques",
    href: "/lp-x7k9m2-internal/ceo/withdrawals",
    icon: Wallet,
  },
  {
    label: "Taxas",
    href: "/lp-x7k9m2-internal/ceo/fees",
    icon: Percent,
  },
  {
    label: "Relatórios",
    href: "/lp-x7k9m2-internal/ceo/reports",
    icon: FileBarChart,
  },
  {
    label: "Premiacoes",
    href: "/lp-x7k9m2-internal/ceo/rewards",
    icon: Gift,
  },
  {
    label: "Afiliados",
    href: "/lp-x7k9m2-internal/ceo/affiliates",
    icon: UsersRound,
  },
  {
    label: "Notificacoes",
    href: "/lp-x7k9m2-internal/ceo/notifications",
    icon: Bell,
  },
  {
    label: "Webhooks",
    href: "/lp-x7k9m2-internal/ceo/webhooks",
    icon: Webhook,
  },
  {
    label: "Logs",
    href: "/lp-x7k9m2-internal/ceo/logs",
    icon: Activity,
  },
  {
    label: "Adquirentes",
    href: "/lp-x7k9m2-internal/ceo/acquirers",
    icon: Server,
  },
  {
    label: "Configurações",
    href: "/lp-x7k9m2-internal/ceo/settings",
    icon: Settings,
  },
];

export default function CEOLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("lp_admin_session");
    const user = localStorage.getItem("lp_admin_user");
    const role = localStorage.getItem("lp_admin_role");

    if (!token || !user || role !== "ceo") {
      router.push("/lp-x7k9m2-internal");
    } else {
      setIsAuthenticated(true);
      setAdminUser(user);
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("lp_admin_session");
    localStorage.removeItem("lp_admin_user");
    localStorage.removeItem("lp_admin_role");
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
          <span className="font-semibold text-white">Admin CEO</span>
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
                  <span className="font-bold text-white">Legacy</span>
                  <span className="font-bold text-primary">Pay</span>
                </div>
                <span className="text-xs text-muted-foreground">Painel CEO</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-white capitalize">
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
                        <span className="font-bold text-white">Legacy</span>
                        <span className="font-bold text-primary">Pay</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Painel CEO
                      </span>
                    </div>
                  </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-white"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-border">
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
