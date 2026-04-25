"use client"

import { Bell, Search, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Profile {
  id: string
  email: string
  name: string | null
  is_admin: boolean
  balance: number
  total_revenue?: number
}

interface User {
  id: string
  email: string
}

interface HeaderProps {
  user: User
  profile: Profile | null
}

// Milestones for rewards
const milestones = [
  { value: 1000, label: "R$ 1K" },
  { value: 10000, label: "R$ 10K" },
  { value: 20000, label: "R$ 20K" },
  { value: 50000, label: "R$ 50K" },
  { value: 75000, label: "R$ 75K" },
  { value: 100000, label: "R$ 100K" },
  { value: 250000, label: "R$ 250K" },
  { value: 375000, label: "R$ 375K" },
  { value: 500000, label: "R$ 500K" },
  { value: 750000, label: "R$ 750K" },
  { value: 1000000, label: "R$ 1M" },
];

function getNextMilestone(totalRevenue: number) {
  for (const milestone of milestones) {
    if (totalRevenue < milestone.value) {
      return milestone;
    }
  }
  return milestones[milestones.length - 1];
}

function getCurrentMilestone(totalRevenue: number) {
  let current = milestones[0];
  for (const milestone of milestones) {
    if (totalRevenue >= milestone.value) {
      current = milestone;
    }
  }
  return current;
}

function formatCompact(value: number) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value}`;
}

export function DashboardHeader({ profile }: HeaderProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const totalRevenue = profile?.total_revenue || 0;
  const currentMilestone = getCurrentMilestone(totalRevenue);
  const nextMilestone = getNextMilestone(totalRevenue);
  
  // Calculate progress between current and next milestone
  const prevValue = currentMilestone.value === nextMilestone.value ? 0 : currentMilestone.value;
  const progressPercent = nextMilestone.value > prevValue
    ? Math.min(100, Math.round(((totalRevenue - prevValue) / (nextMilestone.value - prevValue)) * 100))
    : 100;

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

      <div className="flex items-center gap-3 sm:gap-6 ml-auto">
        {/* Rewards Progress - hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-2">
          <Trophy className="w-4 h-4 text-purple-500" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-purple-400">
              {formatCompact(totalRevenue)}
            </span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground">
              {nextMilestone.label}
            </span>
            <div className="w-16 sm:w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-purple-400 font-medium">
              {progressPercent}%
            </span>
          </div>
        </div>

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
