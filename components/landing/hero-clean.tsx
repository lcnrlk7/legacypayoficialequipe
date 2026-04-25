'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Clock, Shield } from 'lucide-react';

export function HeroClean() {
  return (
    <section className="relative min-h-screen bg-black overflow-hidden">
      {/* Subtle orange glow at bottom center only */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-orange-500/10 to-transparent blur-3xl pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-32 pb-20">
        {/* Logo centered above title */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L4.09 12.11C3.69 12.59 3.89 13.34 4.5 13.5L11 15.5L10 22L19.41 11.89C19.81 11.41 19.61 10.66 19 10.5L12.5 8.5L13 2Z" fill="white" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        {/* Hero Text */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 leading-tight">
            Gateway de pagamento
          </h1>
          <h2 className="text-4xl md:text-6xl font-bold text-orange-500 leading-tight">
            com a menor taxa do mercado
          </h2>
          
          <p className="mt-8 text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Receba pagamentos online com rapidez, simplicidade e baixo custo.
            <br />
            Integração fácil, checkout seguro e suporte sempre disponível.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-all duration-200"
          >
            Começar Agora
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link
            href="/docs"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full border border-gray-800 transition-all duration-200"
          >
            Ver Documentação
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-12 mb-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="text-gray-500 text-sm">Uptime</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">&lt;1s</p>
              <p className="text-gray-500 text-sm">Resposta</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-gray-500 text-sm">Seguro</p>
            </div>
          </div>
        </div>

        {/* Dashboard Preview Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#111111] rounded-2xl border border-gray-800/50 overflow-hidden shadow-2xl">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                <span className="text-white font-semibold">Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-600" />
                <div className="w-3 h-3 rounded-full bg-gray-600" />
                <div className="w-3 h-3 rounded-full bg-orange-500" />
              </div>
            </div>
            
            {/* Dashboard Content */}
            <div className="p-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800/30">
                  <p className="text-gray-500 text-sm mb-2">Saldo Disponível</p>
                  <p className="text-2xl font-bold text-white">R$ 12.450,00</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800/30">
                  <p className="text-gray-500 text-sm mb-2">Recebido Hoje</p>
                  <p className="text-2xl font-bold text-white">R$ 3.280,50</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-800/30">
                  <p className="text-gray-500 text-sm mb-2">Taxa do Mês</p>
                  <p className="text-2xl font-bold text-white">R$ 245,30</p>
                </div>
              </div>
              
              {/* Gradient Bar */}
              <div className="h-24 rounded-xl bg-gradient-to-r from-orange-600/80 via-orange-500/60 to-orange-400/40" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
