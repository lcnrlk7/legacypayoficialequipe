"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  LogOut,
  Menu,
  X,
  MessageCircle,
  LayoutDashboard,
  Wallet,
  TrendingUp,
  FileText,
  ArrowLeftRight,
  Percent,
  User,
  Users,
  Code,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Package,
  Truck,
  Tag,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationCenter } from "./notification-center"
import { AppSettings } from "./app-settings"

interface Profile {
  id: string
  email: string
  name: string | null
  is_admin: boolean
  balance: number
  api_key?: string
  kyc_status?: string
}

interface User {
  id: string
  email: string
}

interface SidebarProps {
  user: User
  profile: Profile | null
}

const menuItems: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/wallet", icon: Wallet, label: "Carteira" },
  { href: "/dashboard/transactions", icon: TrendingUp, label: "Transações" },
  { href: "/dashboard/reports", icon: FileText, label: "Relatórios" },
  { href: "/dashboard/pix-keys", icon: ArrowLeftRight, label: "Chaves PIX" },
  { href: "/dashboard/affiliates", icon: Users, label: "Afiliados" },
  { href: "/dashboard/fees", icon: Percent, label: "Taxas" },
  { href: "/dashboard/integration", icon: Code, label: "Integração API" },
  { href: "/dashboard/settings", icon: Settings, label: "Configurações" },
]

const checkoutMenuItems = [
  { href: "/dashboard/checkout", icon: ShoppingCart, label: "Meus Checkouts" },
  { href: "/dashboard/checkout/orders", icon: Truck, label: "Entregas" },
  { href: "/dashboard/checkout/products", icon: Package, label: "Produtos" },
  { href: "/dashboard/checkout/coupons", icon: Tag, label: "Cupons" },
]

export function DashboardSidebar({ user, profile }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  // Auto-expand checkout menu if on checkout page
  const isCheckoutPage = pathname.startsWith("/dashboard/checkout")

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo-icon.png"
            alt="LegacyPay"
            width={40}
            height={40}
          />
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-white">Legacy</span>
            <span className="text-xl font-bold text-primary">Pay</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
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
              <item.icon className="w-5 h-5 opacity-80" />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                />
              )}
            </Link>
          )
        })}

        {/* Checkout Menu with Submenu */}
        <div className="space-y-1">
          <button
            onClick={() => setCheckoutOpen(!checkoutOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              isCheckoutPage
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 opacity-80" />
              <span className="font-medium">Checkout</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${checkoutOpen || isCheckoutPage ? "rotate-180" : ""}`} />
          </button>
          
          <AnimatePresence>
            {(checkoutOpen || isCheckoutPage) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pl-4"
              >
                {checkoutMenuItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <item.icon className="w-4 h-4 opacity-80" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* KYC Link */}
        {profile?.kyc_status !== "approved" && (
          <Link
            href="/dashboard/kyc"
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === "/dashboard/kyc"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <User className="w-5 h-5 opacity-80" />
            <span className="font-medium">Verificacao KYC</span>
          </Link>
        )}

        {profile?.is_admin && (
          <>
            <div className="pt-4 pb-2">
              <span className="px-4 text-xs text-muted-foreground uppercase tracking-wider">
                Admin
              </span>
            </div>
            <Link
              href="/admin"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname.startsWith("/admin")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <ShieldCheck className="w-5 h-5 opacity-80" />
              <span className="font-medium">Painel Admin</span>
            </Link>
          </>
        )}
      </nav>

      {/* Support Discord */}
      <div className="px-4 pb-2">
        <a
          href="https://discord.gg/vFfknE9kuJ"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#5865F2]/10 text-[#5865F2] hover:bg-[#5865F2]/20 transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Suporte Discord</span>
        </a>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold">
              {(profile?.name || user.email)?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.name || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          <NotificationCenter />
        </div>
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
  )

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

      {/* App Settings Floating Button */}
      <AppSettings />
    </>
  )
}
