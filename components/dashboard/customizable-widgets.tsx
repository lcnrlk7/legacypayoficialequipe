"use client";

import { useState, useEffect } from "react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Star,
  Settings2,
  GripVertical,
  X,
  Plus,
  Zap,
  PiggyBank,
  Target,
  BarChart3,
  CreditCard,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  color: string;
  amount?: number;
}

interface Widget {
  id: string;
  type: "balance" | "quick_withdraw" | "recent_activity" | "stats" | "favorites" | "goals_mini";
  title: string;
  enabled: boolean;
  order: number;
}

interface CustomizableWidgetsProps {
  balance: number;
  totalReceived: number;
  totalSent: number;
  pendingCount: number;
  onQuickWithdraw?: (amount: number) => void;
  savedPixKeys?: Array<{ id: string; key_value: string; key_type: string; label?: string }>;
}

const defaultWidgets: Widget[] = [
  { id: "balance", type: "balance", title: "Saldo Rapido", enabled: true, order: 0 },
  { id: "quick_withdraw", type: "quick_withdraw", title: "Saque Rapido", enabled: true, order: 1 },
  { id: "favorites", type: "favorites", title: "Favoritos", enabled: true, order: 2 },
  { id: "recent_activity", type: "recent_activity", title: "Atividade Recente", enabled: false, order: 3 },
  { id: "stats", type: "stats", title: "Estatisticas", enabled: false, order: 4 },
  { id: "goals_mini", type: "goals_mini", title: "Meta do Mes", enabled: false, order: 5 },
];

const defaultQuickAmounts = [50, 100, 200, 500];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function CustomizableWidgets({
  balance,
  totalReceived,
  totalSent,
  pendingCount,
  onQuickWithdraw,
  savedPixKeys = [],
}: CustomizableWidgetsProps) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [favorites, setFavorites] = useState<QuickAction[]>([]);
  const [quickAmounts, setQuickAmounts] = useState<number[]>(defaultQuickAmounts);
  const [selectedPixKey, setSelectedPixKey] = useState<string | null>(null);

  // Carregar configuracoes do localStorage
  useEffect(() => {
    const savedWidgets = localStorage.getItem("dashboard_widgets");
    const savedFavorites = localStorage.getItem("dashboard_favorites");
    const savedQuickAmounts = localStorage.getItem("dashboard_quick_amounts");
    const savedShowBalance = localStorage.getItem("dashboard_show_balance");
    const savedSelectedPixKey = localStorage.getItem("dashboard_selected_pix_key");

    if (savedWidgets) {
      try {
        setWidgets(JSON.parse(savedWidgets));
      } catch {
        setWidgets(defaultWidgets);
      }
    } else {
      setWidgets(defaultWidgets);
    }

    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch {
        setFavorites([]);
      }
    }

    if (savedQuickAmounts) {
      try {
        setQuickAmounts(JSON.parse(savedQuickAmounts));
      } catch {
        setQuickAmounts(defaultQuickAmounts);
      }
    }

    if (savedShowBalance !== null) {
      setShowBalance(savedShowBalance === "true");
    }

    if (savedSelectedPixKey) {
      setSelectedPixKey(savedSelectedPixKey);
    }
  }, []);

  // Salvar configuracoes
  const saveWidgets = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem("dashboard_widgets", JSON.stringify(newWidgets));
  };

  const saveFavorites = (newFavorites: QuickAction[]) => {
    setFavorites(newFavorites);
    localStorage.setItem("dashboard_favorites", JSON.stringify(newFavorites));
  };

  const saveQuickAmounts = (amounts: number[]) => {
    setQuickAmounts(amounts);
    localStorage.setItem("dashboard_quick_amounts", JSON.stringify(amounts));
  };

  const toggleWidget = (widgetId: string) => {
    const newWidgets = widgets.map((w) =>
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    );
    saveWidgets(newWidgets);
  };

  const reorderWidgets = (newOrder: Widget[]) => {
    const reordered = newOrder.map((w, index) => ({ ...w, order: index }));
    saveWidgets(reordered);
  };

  const handleQuickWithdraw = (amount: number) => {
    if (onQuickWithdraw && amount <= balance) {
      onQuickWithdraw(amount);
    }
  };

  const toggleShowBalance = () => {
    const newValue = !showBalance;
    setShowBalance(newValue);
    localStorage.setItem("dashboard_show_balance", String(newValue));
  };

  const enabledWidgets = widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order);

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case "balance":
        return (
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Saldo Disponivel</span>
              </div>
              <button onClick={toggleShowBalance} className="text-muted-foreground hover:text-foreground">
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {showBalance ? formatCurrency(balance) : "R$ ••••••"}
            </p>
            <div className="flex gap-2 mt-3">
              <Link href="/dashboard/wallet" className="flex-1">
                <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-xs">
                  <ArrowDownLeft className="w-3 h-3 mr-1" />
                  Depositar
                </Button>
              </Link>
              <Link href="/dashboard/wallet" className="flex-1">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  Sacar
                </Button>
              </Link>
            </div>
          </div>
        );

      case "quick_withdraw":
        return (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-foreground">Saque Rapido</span>
            </div>
            {savedPixKeys.length > 0 ? (
              <>
                <select
                  value={selectedPixKey || ""}
                  onChange={(e) => {
                    setSelectedPixKey(e.target.value);
                    localStorage.setItem("dashboard_selected_pix_key", e.target.value);
                  }}
                  className="w-full mb-3 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground"
                >
                  <option value="">Selecione a chave PIX</option>
                  {savedPixKeys.map((key) => (
                    <option key={key.id} value={key.key_value}>
                      {key.label || key.key_value}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickWithdraw(amount)}
                      disabled={amount > balance || !selectedPixKey}
                      className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                        amount <= balance && selectedPixKey
                          ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
                          : "bg-secondary text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      R$ {amount}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Clique para sacar instantaneamente
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Cadastre uma chave PIX para usar o saque rapido
                </p>
                <Link href="/dashboard/pix-keys">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Cadastrar Chave
                  </Button>
                </Link>
              </div>
            )}
          </div>
        );

      case "favorites":
        const defaultFavorites: QuickAction[] = [
          {
            id: "deposit",
            label: "Depositar",
            description: "Adicionar saldo",
            icon: <ArrowDownLeft className="w-5 h-5" />,
            href: "/dashboard/wallet",
            color: "text-green-500",
          },
          {
            id: "withdraw",
            label: "Sacar",
            description: "Retirar saldo",
            icon: <ArrowUpRight className="w-5 h-5" />,
            href: "/dashboard/wallet",
            color: "text-red-500",
          },
          {
            id: "history",
            label: "Historico",
            description: "Ver transacoes",
            icon: <Clock className="w-5 h-5" />,
            href: "/dashboard/history",
            color: "text-blue-500",
          },
          {
            id: "fees",
            label: "Taxas",
            description: "Suas taxas",
            icon: <BarChart3 className="w-5 h-5" />,
            href: "/dashboard/fees",
            color: "text-purple-500",
          },
        ];

        const displayFavorites = favorites.length > 0 ? favorites : defaultFavorites;

        return (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-foreground">Acesso Rapido</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {displayFavorites.slice(0, 4).map((fav) => (
                <Link
                  key={fav.id}
                  href={fav.href || "#"}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className={`${fav.color}`}>{fav.icon}</div>
                  <span className="text-xs font-medium text-foreground">{fav.label}</span>
                </Link>
              ))}
            </div>
          </div>
        );

      case "recent_activity":
        return (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-foreground">Atividade Recente</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ArrowDownLeft className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Deposito</p>
                    <p className="text-xs text-muted-foreground">Hoje</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-500">
                  +{formatCurrency(totalReceived > 0 ? totalReceived / 10 : 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Saque</p>
                    <p className="text-xs text-muted-foreground">Ontem</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-red-500">
                  -{formatCurrency(totalSent > 0 ? totalSent / 10 : 0)}
                </span>
              </div>
            </div>
            <Link href="/dashboard/history">
              <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                Ver todo historico
              </Button>
            </Link>
          </div>
        );

      case "stats":
        return (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-foreground">Resumo</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/10 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="text-lg font-bold text-green-500">{formatCurrency(totalReceived)}</p>
              </div>
              <div className="bg-red-500/10 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Saidas</p>
                <p className="text-lg font-bold text-red-500">{formatCurrency(totalSent)}</p>
              </div>
            </div>
            {pendingCount > 0 && (
              <div className="mt-3 p-2 bg-yellow-500/10 rounded-lg flex items-center justify-between">
                <span className="text-xs text-yellow-500">{pendingCount} transacoes pendentes</span>
                <Clock className="w-4 h-4 text-yellow-500" />
              </div>
            )}
          </div>
        );

      case "goals_mini":
        const monthlyGoal = 5000;
        const progress = Math.min((totalReceived / monthlyGoal) * 100, 100);
        return (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Meta do Mes</span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{formatCurrency(totalReceived)}</span>
                <span className="text-foreground font-medium">{formatCurrency(monthlyGoal)}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {progress >= 100 ? "Meta atingida!" : `Faltam ${formatCurrency(monthlyGoal - totalReceived)}`}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header com botao de edicao */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Seus Widgets</h2>
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs"
        >
          {isEditing ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Concluir
            </>
          ) : (
            <>
              <Settings2 className="w-4 h-4 mr-1" />
              Personalizar
            </>
          )}
        </Button>
      </div>

      {/* Modo de edicao - mostrar todos os widgets */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-secondary/50 rounded-xl p-4 border border-border"
          >
            <p className="text-sm text-muted-foreground mb-3">
              Ative ou desative os widgets que deseja ver no seu painel:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {widgets.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => toggleWidget(widget.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                    widget.enabled
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-card border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      widget.enabled ? "bg-primary border-primary" : "border-muted-foreground"
                    }`}
                  >
                    {widget.enabled && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm">{widget.title}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widgets ativos */}
      {isEditing ? (
        <Reorder.Group
          axis="y"
          values={enabledWidgets}
          onReorder={reorderWidgets}
          className="space-y-3"
        >
          {enabledWidgets.map((widget) => (
            <Reorder.Item key={widget.id} value={widget}>
              <motion.div
                layout
                className="relative group"
              >
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab">
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                </div>
                {renderWidget(widget)}
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {enabledWidgets.map((widget) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {renderWidget(widget)}
            </motion.div>
          ))}
        </div>
      )}

      {enabledWidgets.length === 0 && !isEditing && (
        <div className="text-center py-8 bg-card border border-border rounded-xl">
          <Settings2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">Nenhum widget ativo</p>
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Widgets
          </Button>
        </div>
      )}
    </div>
  );
}
