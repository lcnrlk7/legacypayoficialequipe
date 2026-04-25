"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  LogOut,
  Menu,
  X,
  AlertTriangle,
  LayoutDashboard,
  Users,
  UsersRound,
  TrendingUp,
  Settings,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


const menuItems: { href: string; icon: LucideIcon; label: string; showBadge?: boolean }[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Usuários" },
  { href: "/admin/transactions", icon: TrendingUp, label: "Transações" },
  { href: "/admin/affiliates", icon: UsersRound, label: "Afiliados" },
  { href: "/admin/integration-errors", icon: AlertTriangle, label: "Erros de Integração", showBadge: true },
  { href: "/admin/settings", icon: Settings, label: "Configurações" },
];

export function AdminSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchErrorCount = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        const res = await fetch("/api/admin/integration-errors?resolved=false&limit=1", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setErrorCount(data.unresolvedCount || 0);
      } catch (error) {
        console.error("Error fetching error count:", error);
      }
    };
    fetchErrorCount();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchErrorCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push("/");
    router.refresh();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/admin" className="flex items-center gap-3">
          <Image src="/logo-icon.png" alt="LegacyPay" width={40} height={40} />
          <div>
            <div className="flex items-baseline">
              <span className="text-xl font-bold text-white">Legacy</span>
              <span className="text-xl font-bold text-primary">Pay</span>
            </div>
            <p className="text-xs text-muted-foreground">Painel Admin</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const showBadge = item.showBadge && errorCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.showBadge && errorCount > 0 ? 'text-yellow-500' : 'opacity-80'}`} />
              <span className="font-medium">{item.label}</span>
              {showBadge && (
                <Badge variant="destructive" className="ml-auto text-xs px-2 py-0.5">
                  {errorCount}
                </Badge>
              )}
            </Link>
          );
        })}

        <div className="pt-4">
          <Link
            href="/dashboard"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-5 h-5 opacity-80" />
            <span className="font-medium">Voltar ao Dashboard</span>
          </Link>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen bg-card border-r border-border flex-col fixed left-0 top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-xl text-foreground"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-overlay backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 20 }}
              className="lg:hidden fixed left-0 top-0 w-72 h-screen bg-card border-r border-border flex flex-col z-50"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
