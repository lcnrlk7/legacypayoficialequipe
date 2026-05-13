"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, Shield, Activity, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  id: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, href: "/lp-x7k9m2-internal/amor", id: "dashboard" },
  { label: "Administradores", icon: <Users className="w-5 h-5" />, href: "/lp-x7k9m2-internal/amor/admins", id: "admins" },
  { label: "Roles", icon: <Shield className="w-5 h-5" />, href: "/lp-x7k9m2-internal/amor/roles", id: "roles" },
  { label: "Auditoria", icon: <Activity className="w-5 h-5" />, href: "/lp-x7k9m2-internal/amor/audit", id: "audit" },
];

export function SuperAdminNav({ activeTab }: { activeTab: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/team/logout", { method: "POST" });
      router.push("/lp-x7k9m2-internal/login");
    } catch (error) {
      console.error("[v0] Logout error:", error);
    }
  };

  return (
    <aside className="w-64 bg-background border-r border-border h-screen flex flex-col fixed left-0 top-0">
      {/* Logo/Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Super Admin</h1>
        <p className="text-xs text-muted-foreground mt-1">Painel de Controle</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.id} href={item.href}>
            <Button
              variant={activeTab === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                activeTab === item.id ? "" : "text-muted-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
