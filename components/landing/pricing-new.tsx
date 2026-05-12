'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';

export function PricingNew() {
  const [highlightCol, setHighlightCol] = useState(1);
  const sectionRef = useRef<HTMLDivElement>(null);

  const competitors = [
    { name: 'Competidor A', rate: '1.5%' },
    { name: 'LegacyPay', rate: '0.5%', highlight: true },
    { name: 'Competidor B', rate: '1.8%' },
    { name: 'Competidor C', rate: '2.0%' },
  ];

  const features = [
    'PIX Instantâneo',
    'QR Code Scanner',
    'Copia e Cola',
    'Saque 24/7',
    'Suporte Premium',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightCol((prev) => (prev + 1) % competitors.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={sectionRef} className="relative py-20 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Nossas Taxas são Imbatíveis
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Compare com a concorrência e veja por que somos a melhor opção
          </p>
        </div>

        {/* Pricing Table */}
        <div className="relative overflow-x-auto rounded-2xl border border-slate-700 backdrop-blur">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-6 py-4 text-left text-slate-300 font-semibold">
                  Provedor
                </th>
                {competitors.map((competitor, idx) => (
                  <th
                    key={idx}
                    className={`px-6 py-4 text-center font-bold transition-all duration-300 ${
                      competitor.highlight
                        ? 'text-blue-400 scale-105 text-lg'
                        : 'text-slate-300'
                    }`}
                  >
                    <div
                      className={`transition-all duration-300 ${
                        competitor.highlight
                          ? 'px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg'
                          : ''
                      }`}
                    >
                      {competitor.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700">
              {/* Taxa */}
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 text-slate-300 font-semibold">
                  Taxa de Transferência
                </td>
                {competitors.map((competitor, idx) => (
                  <td
                    key={idx}
                    className={`px-6 py-4 text-center font-bold text-lg transition-all duration-300 ${
                      competitor.highlight
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 scale-110'
                        : 'text-slate-400'
                    }`}
                  >
                    {competitor.rate}
                  </td>
                ))}
              </tr>

              {/* Features */}
              {features.map((feature, featureIdx) => (
                <tr
                  key={featureIdx}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-300">{feature}</td>
                  {competitors.map((_, idx) => (
                    <td
                      key={idx}
                      className="px-6 py-4 text-center"
                    >
                      <Check className="w-6 h-6 mx-auto text-green-400 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <p className="text-slate-300 text-lg mb-6">
            Economize até <span className="font-bold text-green-400">75%</span> em taxas transferindo com a LegacyPay
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/50 hover:scale-105 transition-all duration-300">
            Começar a Economizar Agora
          </button>
        </div>
      </div>
    </section>
  );
}
