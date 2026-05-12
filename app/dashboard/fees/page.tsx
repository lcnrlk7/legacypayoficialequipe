"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Percent,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  TrendingDown,
  Clock,
  Shield,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
} from "lucide-react";

interface UserFees {
  pix_fixed_fee: number;
  pix_percentage_fee: number;
  withdrawal_fee: number;
  withdrawal_fee_is_percentage: boolean;
  user_fee_percentage: number;
  has_percentage_fee: boolean;
  gateway_name: string;
  route_type: string;
  daily_limit: number;
  monthly_limit: number;
  min_deposit: number;
  max_deposit: number;
  min_withdrawal: number;
  max_withdrawal: number;
  per_withdrawal_limit: number;
  total_fees_paid: number;
  total_transactions: number;
  total_volume: number;
}

export default function FeesPage() {
  const [fees, setFees] = useState<UserFees | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFees();
  }, []);

  async function loadFees() {
    try {
      const response = await fetch("/api/user/fees");
      const data = await response.json();
      if (data.fees) {
        setFees(data.fees);
      }
    } catch (error) {
      console.error("Error loading fees:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  const formatPercent = (value: number | null | undefined) => {
    const num = Number(value) || 0;
    return `${num.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Taxas e Limites</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Confira suas taxas e limites de operacao
          </p>
        </div>
        {fees && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
            fees.route_type === 'black' 
              ? 'bg-orange-500/10 border border-orange-500/20' 
              : 'bg-zinc-500/10 border border-zinc-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              fees.route_type === 'black' ? 'bg-orange-500' : 'bg-zinc-400'
            }`} />
            <span className={`font-semibold ${
              fees.route_type === 'black' ? 'text-orange-500' : 'text-zinc-400'
            }`}>
              Rota {fees.route_type?.toUpperCase() || 'BLACK'}
            </span>
          </div>
        )}
      </div>

      {/* Resumo de Taxas Pagas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-red-500/20">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <span className="text-xs sm:text-sm text-red-400">Total em Taxas</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(fees?.total_fees_paid || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
            Taxas descontadas
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-500/20">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <span className="text-xs sm:text-sm text-blue-400">Volume Total</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(fees?.total_volume || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
            Total movimentado
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-purple-500/20">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <span className="text-xs sm:text-sm text-purple-400">Transacoes</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {fees?.total_transactions || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
            Total de transacoes
          </p>
        </motion.div>
      </div>

      {/* Alerta de rota atual */}
      {fees && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-xl ${
            fees.route_type === 'black'
              ? 'bg-orange-500/10 border border-orange-500/20'
              : 'bg-green-500/10 border border-green-500/20'
          }`}
        >
          <TrendingDown className={`w-5 h-5 flex-shrink-0 ${
            fees.route_type === 'black' ? 'text-orange-500' : 'text-green-500'
          }`} />
          <p className={`text-sm ${fees.route_type === 'black' ? 'text-orange-400' : 'text-green-400'}`}>
            Você está na rota <strong>{fees.route_type?.toUpperCase() || 'BLACK'}</strong> -{' '}
            {fees.has_percentage_fee ? (
              fees.pix_fixed_fee > 0 ? (
                <>Taxa de <strong>{formatPercent(fees.pix_percentage_fee)} + {formatCurrency(fees.pix_fixed_fee)}</strong> por transação</>
              ) : (
                <>Taxa de <strong>{formatPercent(fees.pix_percentage_fee)}</strong> por transação</>
              )
            ) : (
              <>Taxa fixa de <strong>{formatCurrency(fees.pix_fixed_fee)}</strong> por transação</>
            )}
          </p>
        </motion.div>
      )}

      {/* Sua Taxa Personalizada */}
      {fees && fees.user_fee_percentage > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20"
        >
          <Percent className="w-5 h-5 flex-shrink-0 text-primary" />
          <p className="text-sm text-primary">
            Sua taxa personalizada: <strong>{formatPercent(fees.user_fee_percentage)}</strong> -{' '}
            Limite diário: <strong>{formatCurrency(fees.daily_limit)}</strong>
          </p>
        </motion.div>
      )}

      {/* Cards Principais - Taxas e Limites */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Taxa de Entrada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Taxa de Entrada</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {fees?.has_percentage_fee 
              ? formatPercent(fees?.pix_percentage_fee)
              : formatCurrency(fees?.pix_fixed_fee || 0)
            }
          </p>
        </motion.div>

        {/* Taxa de Saída */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Taxa de Saida</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {fees?.withdrawal_fee_is_percentage 
              ? formatPercent(fees?.withdrawal_fee || 0)
              : formatCurrency(fees?.withdrawal_fee || 0)
            }
          </p>
        </motion.div>

        {/* Limite Diário */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Limite Diario</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(fees?.daily_limit || 10000)}
          </p>
        </motion.div>

        {/* Limite por Saque */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-5 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Limite por Saque</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(fees?.per_withdrawal_limit || fees?.max_withdrawal || 10000)}
          </p>
        </motion.div>
      </div>

      {/* Detalhes de Deposito e Saque */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Depositos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Depositos (PIX In)</h3>
              <p className="text-sm text-muted-foreground">Limites por operacao</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Minimo</p>
              <p className="font-semibold text-foreground">
                {formatCurrency(fees?.min_deposit || 10)}
              </p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Maximo</p>
              <p className="font-semibold text-foreground">
                {formatCurrency(fees?.max_deposit || 50000)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Saques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Saques (PIX Out)</h3>
              <p className="text-sm text-muted-foreground">Limites por operacao</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Minimo</p>
              <p className="font-semibold text-foreground">
                {formatCurrency(fees?.min_withdrawal || 10)}
              </p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Maximo</p>
              <p className="font-semibold text-foreground">
                {formatCurrency(fees?.max_withdrawal || 10000)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Informações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl"
      >
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Como funcionam as taxas?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>A taxa de depósito é descontada automaticamente do valor recebido</li>
              <li>A taxa de saque é um valor fixo descontado por operação</li>
              <li>Taxas podem ser personalizadas com base no seu volume de transações</li>
              <li>Entre em contato com o suporte para negociar taxas especiais</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Exemplo de Cálculo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Percent className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Exemplo de Cálculo</h3>
            <p className="text-sm text-muted-foreground">Veja como suas taxas são aplicadas</p>
          </div>
        </div>

        <div className="bg-background/50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <span className="text-muted-foreground">Valor do depósito</span>
            <span className="font-semibold text-foreground">R$ 100,00</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <span className="text-muted-foreground">
              Taxa (Rota {fees?.route_type?.toUpperCase() || 'BLACK'})
            </span>
            <span className="font-semibold text-red-400">
              {fees?.has_percentage_fee 
                ? `- R$ ${(100 * (fees?.pix_percentage_fee || 0) / 100 + (fees?.pix_fixed_fee || 0)).toFixed(2).replace('.', ',')}`
                : `- ${formatCurrency(fees?.pix_fixed_fee || 0)}`
              }
            </span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="font-semibold text-foreground">Valor liquido</span>
            <span className="font-bold text-green-400 text-lg">
              {fees?.has_percentage_fee
                ? formatCurrency(100 - (100 * (fees?.pix_percentage_fee || 0) / 100) - (fees?.pix_fixed_fee || 0))
                : formatCurrency(100 - (fees?.pix_fixed_fee || 0))
              }
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
