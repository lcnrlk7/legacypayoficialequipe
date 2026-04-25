'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function HeroLiquidFinance() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY / scrollHeight;
      setScrollProgress(Math.min(scrolled, 1));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 z-20">
      <div className="relative w-full max-w-6xl mx-auto px-4 text-center">
        {/* Glowing orbs around hero */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

        {/* Badge/Pill */}
        <div className="inline-block mb-8">
          <div className="px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm">
            <span className="flex items-center gap-2 text-blue-300 text-sm font-medium">
              <span className="flex items-center justify-center w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              Novo jeito de transferir dinheiro
            </span>
          </div>
        </div>

        {/* Main title with animated gradient - Textos Originais */}
        <div className="mb-8 space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-shift leading-tight">
            Transferências PIX<br />Instantâneas e Seguras
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Faça transferências PIX com segurança, velocidade e a melhor taxa do mercado. Sem complicações, sem burocracias.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/auth/register"
            className="relative px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>

          <button
            className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-purple-500/50 text-purple-300 hover:bg-purple-500/10 transition-all duration-300 backdrop-blur-sm"
          >
            Ver Demo
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="flex flex-col items-center gap-2 text-gray-400 animate-bounce">
          <p className="text-sm">Deslize para explorar</p>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {/* Progress bar */}
        <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-50 transition-all duration-100" style={{ width: `${scrollProgress * 100}%` }}></div>
      </div>
    </section>
  );
}
