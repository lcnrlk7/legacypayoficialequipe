'use client';

import React from 'react';
import { Eye, EyeOff, Copy, Settings, Home, Wallet, TrendingUp, Lock, Zap } from 'lucide-react';
import { useState } from 'react';

export function DashboardPreview() {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center py-20 z-20 px-4">
      <div className="relative w-full max-w-7xl">
        {/* Section title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Dashboard Intuitivo
          </h2>
          <p className="text-gray-400 text-lg">
            Gerenciar suas transações PIX é simples e seguro
          </p>
        </div>

        {/* Dashboard Container */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-orange-500/20 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-12 h-screen max-h-[600px]">
            {/* Sidebar */}
            <div className="col-span-2 bg-gradient-to-b from-gray-950 to-black border-r border-orange-500/10 p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-8 pb-6 border-b border-orange-500/10">
                <Zap className="w-6 h-6 text-orange-500" />
                <span className="font-bold text-white">LegacyPay</span>
              </div>

              <nav className="space-y-3 flex-1">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <Home className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-orange-300 font-medium">Dashboard</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <Wallet className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-400">Carteira</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <TrendingUp className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-400">Transações</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <Lock className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-400">Segurança</span>
                </div>
              </nav>

              <button className="flex items-center gap-3 px-3 py-2 rounded-lg w-full hover:bg-gray-800/50 transition-colors border-t border-gray-800 pt-4">
                <Settings className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-400">Configurações</span>
              </button>
            </div>

            {/* Main Content */}
            <div className="col-span-10 p-8 overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-white">Olá, Usuário!</h1>
                  <p className="text-gray-400 text-sm">Bem-vindo ao seu painel de controle</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Saldo Líquido</p>
                  <p className="text-3xl font-bold text-orange-400">R$ 437.855,00</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 hover:border-orange-500/30 transition-colors">
                  <p className="text-gray-400 text-sm mb-2">Saldo</p>
                  <p className="text-xl font-bold text-white">R$ 437.855,00</p>
                  <p className="text-green-400 text-xs mt-1">Disponível para saque</p>
                </div>
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 hover:border-orange-500/30 transition-colors">
                  <p className="text-gray-400 text-sm mb-2">Bruto</p>
                  <p className="text-xl font-bold text-white">R$ 20,00</p>
                  <p className="text-blue-400 text-xs mt-1">Este mês</p>
                </div>
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 hover:border-orange-500/30 transition-colors">
                  <p className="text-gray-400 text-sm mb-2">Líquido</p>
                  <p className="text-xl font-bold text-white">R$ 18,50</p>
                  <p className="text-green-400 text-xs mt-1">Este mês</p>
                </div>
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 hover:border-orange-500/30 transition-colors">
                  <p className="text-gray-400 text-sm mb-2">Chaves PIX</p>
                  <p className="text-xl font-bold text-white">3</p>
                  <p className="text-orange-400 text-xs mt-1">Cadastradas</p>
                </div>
              </div>

              {/* API Key Section */}
              <div className="bg-gray-800/40 border border-orange-500/20 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Sua Chave API</h3>
                    <p className="text-gray-400 text-sm">Use para integrar com sua aplicação</p>
                  </div>
                  <Copy className="w-5 h-5 text-gray-500 cursor-pointer hover:text-orange-400 transition-colors" />
                </div>
                <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value="ip_7a7bc021cd38483b896b15209f537865"
                    readOnly
                    className="bg-transparent text-gray-400 text-sm flex-1 outline-none font-mono"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-gray-500 hover:text-orange-400 transition-colors"
                  >
                    {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  Depositar
                </button>
                <button className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Sacar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Note below dashboard */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>
            Os dados acima são <span className="text-orange-400">demonstrativos</span> • APIs bloqueadas para segurança
          </p>
        </div>
      </div>
    </section>
  );
}
