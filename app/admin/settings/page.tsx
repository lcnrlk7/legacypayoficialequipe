"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Loader2, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    pixFeePercentage: "1.5",
    minWithdrawal: "10.00",
    maxWithdrawal: "50000.00",
    dailyWithdrawalLimit: "100000.00",
  });

  const handleSave = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
  };

  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">
          Configurações gerais do sistema
        </p>
      </div>

      {/* Fee Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Percent className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Taxas</h2>
            <p className="text-sm text-muted-foreground">
              Configure as taxas do sistema
            </p>
          </div>
        </div>

        <div className="grid gap-6 max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Taxa PIX (%)
            </label>
            <Input
              type="number"
              step="0.1"
              value={settings.pixFeePercentage}
              onChange={(e) =>
                setSettings({ ...settings, pixFeePercentage: e.target.value })
              }
              className="bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground">
              Percentual cobrado em cada transação
            </p>
          </div>
        </div>
      </motion.div>

      {/* Withdrawal Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Limites de Saque
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure os limites de saque
            </p>
          </div>
        </div>

        <div className="grid gap-6 max-w-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Valor Mínimo (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={settings.minWithdrawal}
              onChange={(e) =>
                setSettings({ ...settings, minWithdrawal: e.target.value })
              }
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Valor Máximo por Transação (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={settings.maxWithdrawal}
              onChange={(e) =>
                setSettings({ ...settings, maxWithdrawal: e.target.value })
              }
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Limite Diário (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={settings.dailyWithdrawalLimit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  dailyWithdrawalLimit: e.target.value,
                })
              }
              className="bg-secondary border-border"
            />
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </motion.div>
    </div>
  );
}
