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
  UserCircle,
  Users,
  Code,
  Settings,
  ShieldCheck,
  Shield,
  ShoppingCart,
  Package,
  Truck,
  Tag,
  ChevronDown,
  FolderKanban,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationCenter } from "./notification-center"

interface Profile {
  id: string
  email: string
  name: string | null
  is_admin: boolean
  balance: number
  api_key?: string
  kyc_status?: string
  avatar_url?: string | null
}

interface User {
  id: string
  email: string
}

interface SidebarProps {
  user: User
  profile: Profile | null
}

// Menu organizado em categorias com cores
const menuCategories = [
  {
    title: "Visao Geral",
    color: "primary", // Laranja
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/dashboard/wallet", icon: Wallet, label: "Carteira" },
      { href: "/dashboard/transactions", icon: TrendingUp, label: "Transacoes" },
      { href: "/dashboard/reports", icon: FileText, label: "Relatorios" },
    ],
  },
  {
    title: "Conta",
    color: "emerald", // Verde
    items: [
      { href: "/dashboard/profile", icon: UserCircle, label: "Meu Perfil" },
      { href: "/dashboard/pix-keys", icon: ArrowLeftRight, label: "Chaves PIX" },
      { href: "/dashboard/fees", icon: Percent, label: "Taxas" },
      { href: "/dashboard/affiliates", icon: Users, label: "Afiliados" },
    ],
  },
  {
    title: "E-commerce",
    color: "blue", // Azul
    hasSubmenu: true,
    items: [
      { href: "/dashboard/checkout", icon: ShoppingCart, label: "Meus Checkouts" },
      { href: "/dashboard/checkout/orders", icon: Truck, label: "Entregas" },
      { href: "/dashboard/checkout/products", icon: Package, label: "Produtos" },
      { href: "/dashboard/checkout/coupons", icon: Tag, label: "Cupons" },
    ],
  },
  {
    title: "Suporte",
    color: "cyan", // Ciano
    items: [
      { href: "/dashboard/support", icon: MessageCircle, label: "Tickets" },
    ],
  },
  {
    title: "Configuracoes",
    color: "purple", // Roxo
    items: [
      { href: "/dashboard/management", icon: FolderKanban, label: "Gestao" },
      { href: "/dashboard/integration", icon: Code, label: "Integracao API" },
      { href: "/dashboard/security", icon: Shield, label: "Seguranca" },
      { href: "/dashboard/settings", icon: Settings, label: "Preferencias" },
    ],
  },
]

// Funcao para obter classes de cor
const getColorClasses = (color: string, isActive: boolean) => {
  const colors: Record<string, { label: string; active: string; hover: string; icon: string }> = {
    primary: {
      label: "text-primary/70",
      active: "bg-gradient-to-r from-primary/20 to-primary/5 text-primary border-l-2 border-primary shadow-sm shadow-primary/10",
      hover: "hover:bg-primary/5 hover:text-primary",
      icon: "text-primary",
    },
    emerald: {
      label: "text-emerald-500/70",
      active: "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-l-2 border-emerald-500 shadow-sm shadow-emerald-500/10",
      hover: "hover:bg-emerald-500/5 hover:text-emerald-400",
      icon: "text-emerald-400",
    },
    blue: {
      label: "text-blue-500/70",
      active: "bg-gradient-to-r from-blue-500/20 to-blue-500/5 text-blue-400 border-l-2 border-blue-500 shadow-sm shadow-blue-500/10",
      hover: "hover:bg-blue-500/5 hover:text-blue-400",
      icon: "text-blue-400",
    },
    cyan: {
      label: "text-cyan-500/70",
      active: "bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-l-2 border-cyan-500 shadow-sm shadow-cyan-500/10",
      hover: "hover:bg-cyan-500/5 hover:text-cyan-400",
      icon: "text-cyan-400",
    },
    purple: {
      label: "text-purple-500/70",
      active: "bg-gradient-to-r from-purple-500/20 to-purple-500/5 text-purple-400 border-l-2 border-purple-500 shadow-sm shadow-purple-500/10",
      hover: "hover:bg-purple-500/5 hover:text-purple-400",
      icon: "text-purple-400",
    },
    red: {
      label: "text-red-500/70",
      active: "bg-gradient-to-r from-red-500/20 to-red-500/5 text-red-400 border-l-2 border-red-500 shadow-sm shadow-red-500/10",
      hover: "hover:bg-red-500/5 hover:text-red-400",
      icon: "text-red-400",
    },
  }
  return colors[color] || colors.primary
}

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
    <div className="flex flex-col h-full bg-gradient-to-b from-sidebar to-black/95">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all" />
            <Image
              src="/logo-icon.png"
              alt="LegacyPay"
              width={44}
              height={44}
              className="relative drop-shadow-lg"
            />
          </div>
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-foreground">Legacy</span>
            <span className="text-xl font-bold text-primary">Pay</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        {menuCategories.map((category, categoryIndex) => {
          const colorClasses = getColorClasses(category.color, false)
          const isEcommerce = category.title === "E-commerce"
          
          return (
            <div key={category.title} className={categoryIndex > 0 ? "pt-5" : "pt-2"}>
              {/* Category Title */}
              <div className="pb-2">
                <span className={`px-4 text-[10px] font-semibold uppercase tracking-widest ${colorClasses.label}`}>
                  {category.title}
                </span>
              </div>
              
              {/* E-commerce with submenu */}
              {isEcommerce ? (
                <div className="space-y-1">
                  <button
                    onClick={() => setCheckoutOpen(!checkoutOpen)}
                    className={`w-full group flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
                      isCheckoutPage
                        ? colorClasses.active
                        : `text-muted-foreground ${colorClasses.hover}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart className={`w-5 h-5 transition-transform duration-200 ${isCheckoutPage ? colorClasses.icon : "group-hover:scale-110"}`} />
                      <span className="font-medium">Checkout</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${checkoutOpen || isCheckoutPage ? "rotate-180" : ""}`} />
                  </button>
                  
                  <AnimatePresence>
                    {(checkoutOpen || isCheckoutPage) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 space-y-0.5 pt-1">
                          {category.items.map((item) => {
                            const isActive = pathname === item.href
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`group flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                                  isActive
                                    ? colorClasses.active
                                    : `text-muted-foreground ${colorClasses.hover}`
                                }`}
                              >
                                <item.icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? colorClasses.icon : "group-hover:scale-110"}`} />
                                <span className="text-sm font-medium">{item.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Regular menu items */
                category.items.map((item) => {
                  const isActive = pathname === item.href
                  // Definir data-onboarding baseado no link
                  const onboardingId = 
                    item.href === "/dashboard/wallet" ? "wallet-link" :
                    item.href === "/dashboard/integration" ? "api-link" :
                    item.href === "/dashboard/support" ? "support-link" :
                    undefined
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      data-onboarding={onboardingId}
                      className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? colorClasses.active
                          : `text-muted-foreground ${colorClasses.hover}`
                      }`}
                    >
                      <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? colorClasses.icon : "group-hover:scale-110"}`} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })
              )}
            </div>
          )
        })}

        {/* KYC Link */}
        {profile?.kyc_status !== "approved" && (
          <Link
            href="/dashboard/kyc"
            onClick={() => setIsMobileOpen(false)}
            className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 mt-2 ${
              pathname === "/dashboard/kyc"
                ? "bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 text-yellow-400 border-l-2 border-yellow-500 shadow-sm shadow-yellow-500/10"
                : "text-yellow-500/70 hover:bg-yellow-500/5 hover:text-yellow-400"
            }`}
          >
            <User className={`w-5 h-5 transition-transform duration-200 ${pathname === "/dashboard/kyc" ? "text-yellow-400" : "group-hover:scale-110"}`} />
            <span className="font-medium">Verificacao KYC</span>
          </Link>
        )}

        {/* Admin */}
        {profile?.is_admin && (
          <div className="pt-5">
            <div className="pb-2">
              <span className="px-4 text-[10px] font-semibold text-red-500/70 uppercase tracking-widest">
                Administracao
              </span>
            </div>
            <Link
              href="/lp-x7k9m2-internal/ceo"
              onClick={() => setIsMobileOpen(false)}
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                pathname.startsWith("/lp-x7k9m2-internal")
                  ? "bg-gradient-to-r from-red-500/20 to-red-500/5 text-red-400 border-l-2 border-red-500 shadow-sm shadow-red-500/10"
                  : "text-muted-foreground hover:bg-red-500/5 hover:text-red-400"
              }`}
            >
              <ShieldCheck className={`w-5 h-5 transition-transform duration-200 ${pathname.startsWith("/lp-x7k9m2-internal") ? "text-red-400" : "group-hover:scale-110"}`} />
              <span className="font-medium">Painel CEO</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Support Links */}
      <div className="px-4 pb-2 space-y-2">
        <a
          href="https://discord.gg/legacypay"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#5865F2]/10 to-[#5865F2]/5 text-[#5865F2] hover:from-[#5865F2]/20 hover:to-[#5865F2]/10 transition-all border border-[#5865F2]/20"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          <span className="font-medium">Suporte Discord</span>
        </a>
        <a
          href="https://wa.me/5534999353187"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500/10 to-green-500/5 text-green-500 hover:from-green-500/20 hover:to-green-500/10 transition-all border border-green-500/20"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="font-medium">WhatsApp</span>
        </a>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border/50 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.name || "Avatar"}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-primary font-bold">
                {(profile?.name || user.email)?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.name || "Usuario"}
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
      <aside 
        data-onboarding="sidebar"
        className="hidden lg:flex w-64 h-screen bg-card border-r border-border flex-col fixed left-0 top-0"
      >
        <SidebarContent />
      </aside>

      {/* Mobile Header Bar - Barra fixa no topo */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-40 flex items-center justify-between px-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-secondary border border-border rounded-xl text-foreground flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Saldo e Notificacoes no mobile */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Saldo Liquido</p>
            <p className="text-sm font-bold text-primary">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(profile?.balance || 0))}
            </p>
          </div>
          <NotificationCenter />
        </div>
      </div>

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
  )
}
