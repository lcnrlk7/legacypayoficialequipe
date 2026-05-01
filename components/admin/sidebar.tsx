"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Users,
  UsersRound,
  UserCheck,
  TrendingUp,
  Wallet,
  Percent,
  FileText,
  Gift,
  Bell,
  BellRing,
  ScrollText,
  Building2,
  Settings,
  Webhook,
  ArrowLeft,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";


// Visao Geral
const overviewItems: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/reports", icon: FileText, label: "Relatorios" },
];

// Usuarios & Equipe
const usersItems: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/admin/users", icon: Users, label: "Usuarios" },
  { href: "/admin/team", icon: UsersRound, label: "Equipe" },
  { href: "/admin/kyc", icon: UserCheck, label: "KYC" },
  { href: "/admin/affiliates", icon: Users, label: "Afiliados" },
];

// Financeiro
const financeItems: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/admin/transactions", icon: TrendingUp, label: "Transacoes" },
  { href: "/admin/withdrawals", icon: Wallet, label: "Saques" },
  { href: "/admin/fees", icon: Percent, label: "Taxas" },
  { href: "/admin/checkouts", icon: ShoppingCart, label: "Checkouts" },
];

// Engajamento
const engagementItems: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/admin/rewards", icon: Gift, label: "Premiacoes" },
  { href: "/admin/notifications", icon: Bell, label: "Notificacoes" },
  { href: "/admin/lp-x7k9m2-internal/push", icon: BellRing, label: "Push Notifications" },
];

// Sistema
const systemItems: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/admin/webhooks", icon: Webhook, label: "Webhooks" },
  { href: "/admin/logs", icon: ScrollText, label: "Logs" },
  { href: "/admin/acquirers", icon: Building2, label: "Adquirentes" },
  { href: "/admin/settings", icon: Settings, label: "Configuracoes" },
];

export function AdminSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
              <span className="text-xl font-bold text-foreground">Legacy</span>
              <span className="text-xl font-bold text-primary">Pay</span>
            </div>
            <p className="text-xs text-muted-foreground">Painel Admin</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Visao Geral */}
        <div className="pb-2">
          <span className="px-4 text-xs text-muted-foreground uppercase tracking-wider">
            Visao Geral
          </span>
        </div>
        {overviewItems.map((item) => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 opacity-80" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* Usuarios & Equipe */}
        <div className="pt-4 pb-2">
          <span className="px-4 text-xs text-muted-foreground uppercase tracking-wider">
            Usuarios & Equipe
          </span>
        </div>
        {usersItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 opacity-80" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* Financeiro */}
        <div className="pt-4 pb-2">
          <span className="px-4 text-xs text-muted-foreground uppercase tracking-wider">
            Financeiro
          </span>
        </div>
        {financeItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 opacity-80" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* Engajamento */}
        <div className="pt-4 pb-2">
          <span className="px-4 text-xs text-muted-foreground uppercase tracking-wider">
            Engajamento
          </span>
        </div>
        {engagementItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 opacity-80" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* Sistema */}
        <div className="pt-4 pb-2">
          <span className="px-4 text-xs text-muted-foreground uppercase tracking-wider">
            Sistema
          </span>
        </div>
        {systemItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 opacity-80" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* Voltar */}
        <div className="pt-4">
          <Link
            href="/dashboard"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-5 h-5 opacity-80" />
            <span className="font-medium text-sm">Voltar ao Dashboard</span>
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
