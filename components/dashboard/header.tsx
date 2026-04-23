"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Profile {
  id: string
  email: string
  name: string | null
  is_admin: boolean
  balance: number
}

interface User {
  id: string
  email: string
}

interface HeaderProps {
  user: User
  profile: Profile | null
}

export function DashboardHeader({ profile }: HeaderProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <header className="h-14 sm:h-16 lg:h-20 bg-card border-b border-border flex items-center justify-between pl-14 pr-3 sm:pl-4 sm:pr-4 lg:px-8">
      {/* Search - hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        {/* Balance */}
        <div className="text-right">
          <p className="text-[10px] sm:text-xs text-muted-foreground">Saldo Líquido</p>
          <p className="text-sm sm:text-lg font-bold text-primary">
            {formatCurrency(Number(profile?.balance) || 0)}
          </p>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full" />
        </Button>
      </div>
    </header>
  )
}
