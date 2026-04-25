"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface SalesChartProps {
  transactions: Transaction[];
}

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`;
  }
  return `R$ ${value.toFixed(0)}`;
};

export function SalesChart({ transactions }: SalesChartProps) {
  const chartData = useMemo(() => {
    // Agrupar transacoes por mes
    const monthlyData: Record<string, number> = {};
    
    // Inicializar todos os meses do ano atual
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 12; i++) {
      const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      monthlyData[key] = 0;
    }

    // Somar transacoes de deposito por mes
    transactions
      .filter(t => 
        ["deposit", "transfer_in", "pix_in"].includes(t.type) && 
        t.status === "completed"
      )
      .forEach(t => {
        const date = new Date(t.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key] !== undefined) {
          monthlyData[key] += Number(t.amount) || 0;
        }
      });

    // Converter para array de dados do grafico
    return Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => {
        const [, month] = key.split('-');
        return {
          name: monthNames[parseInt(month) - 1],
          vendas: value,
        };
      });
  }, [transactions]);

  const totalVendas = chartData.reduce((sum, item) => sum + item.vendas, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Analise de Vendas</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Visualize o desempenho das suas vendas
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(totalVendas)}
          </p>
          <p className="text-xs text-muted-foreground">Total no ano</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[250px] sm:h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.05)" 
              vertical={false}
            />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#888', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#888', fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value)}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '12px',
              }}
              labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
              formatter={(value: number) => [
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(value),
                "Vendas"
              ]}
            />
            <Area
              type="monotone"
              dataKey="vendas"
              stroke="#f97316"
              strokeWidth={3}
              fill="url(#colorVendas)"
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
