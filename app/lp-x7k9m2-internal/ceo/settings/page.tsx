"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Percent, DollarSign, Shield, Bell } from "lucide-react";

interface SystemSettings {
  pix_fee_percentage: string;
  min_deposit: string;
  max_deposit: string;
  min_withdrawal: string;
  max_withdrawal: string;
  daily_withdrawal_limit: string;
  auto_withdrawal_limit: string;
  withdrawal_fee_percentage: string;
  withdrawal_fee_fixed: string;
  acquirer_withdrawal_fee: string;
  white_route_percentage: string;
  white_route_fixed: string;
  black_route_percentage: string;
  black_route_fixed: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    pix_fee_percentage: "1.5",
    min_deposit: "5.00",
    max_deposit: "100000.00",
    min_withdrawal: "5.00",
    max_withdrawal: "50000.00",
    daily_withdrawal_limit: "100000.00",
    auto_withdrawal_limit: "500.00",
    withdrawal_fee_percentage: "1.5",
    withdrawal_fee_fixed: "0.00",
    acquirer_withdrawal_fee: "1.00",
    white_route_percentage: "0.75",
    white_route_fixed: "1.00",
    black_route_percentage: "1.5",
    black_route_fixed: "1.50",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data && typeof data === "object" && !data.error) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    setIsLoading(false);
  }

  async function saveSettings() {
    setIsSaving(true);
    
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
    
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-secondary rounded-lg" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-secondary rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Configurações</h1>
          <p className="text-muted-foreground">
            Configure as taxas e limites do sistema
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Salvando...
            </>
          ) : saved ? (
            <>
              <Shield className="w-5 h-5" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>

      {/* Taxas por Rota */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <Percent className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Taxas por Rota</h2>
            <p className="text-sm text-muted-foreground">
              Configure as taxas para cada tipo de rota
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rota White */}
          <div className="p-4 rounded-xl bg-secondary border border-border">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-zinc-400" />
              Rota White
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Taxa Percentual (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.white_route_percentage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      white_route_percentage: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Valor Fixo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.white_route_fixed}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      white_route_fixed: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Rota Black */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              Rota Black
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Taxa Percentual (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.black_route_percentage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      black_route_percentage: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Valor Fixo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.black_route_fixed}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      black_route_fixed: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Limites de Depósito */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-400/10">
            <DollarSign className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Limites de Depósito</h2>
            <p className="text-sm text-muted-foreground">
              Configure os limites para depósitos PIX
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Valor Mínimo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.min_deposit}
              onChange={(e) =>
                setSettings({ ...settings, min_deposit: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Valor Máximo por Depósito (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.max_deposit}
              onChange={(e) =>
                setSettings({ ...settings, max_deposit: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </motion.div>

      {/* Limites de Saque */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-green-400/10">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Limites de Saque</h2>
            <p className="text-sm text-muted-foreground">
              Configure os limites para solicitações de saque
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Valor Mínimo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.min_withdrawal}
              onChange={(e) =>
                setSettings({ ...settings, min_withdrawal: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Valor Máximo (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.max_withdrawal}
              onChange={(e) =>
                setSettings({ ...settings, max_withdrawal: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Limite Diário (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.daily_withdrawal_limit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  daily_withdrawal_limit: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Automático até (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.auto_withdrawal_limit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  auto_withdrawal_limit: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Acima deste valor requer aprovação
            </p>
          </div>
        </div>

        {/* Taxas de Saque */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-md font-medium text-white mb-4">Taxas de Saque</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Taxa LegacyPay (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.withdrawal_fee_percentage}
                onChange={(e) =>
                  setSettings({ ...settings, withdrawal_fee_percentage: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lucro da LegacyPay sobre cada saque
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Taxa Fixa LegacyPay (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.withdrawal_fee_fixed}
                onChange={(e) =>
                  setSettings({ ...settings, withdrawal_fee_fixed: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Valor fixo adicional por saque
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Taxa MisticPay (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.acquirer_withdrawal_fee}
                onChange={(e) =>
                  setSettings({ ...settings, acquirer_withdrawal_fee: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-white focus:outline-none focus:border-primary/50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Taxa fixa da adquirente (custo)
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
      >
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm text-blue-400 font-medium">
              Alterações em tempo real
            </p>
            <p className="text-sm text-blue-300/70">
              As configurações são aplicadas imediatamente após salvar. Taxas
              personalizadas de usuários têm prioridade sobre as taxas padrão.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
