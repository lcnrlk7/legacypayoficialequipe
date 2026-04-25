'use client';

import React, { useState, useEffect } from 'react';
import { Send, QrCode, Copy } from 'lucide-react';

export function ProductDemoPlayground() {
  const [selectedMethod, setSelectedMethod] = useState<'key' | 'qr' | 'copy'>('key');
  const [amount, setAmount] = useState('100');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTransfer = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsProcessing(false);
  };

  const methods = [
    { id: 'key', label: 'Chave Salva', icon: '🔑' },
    { id: 'qr', label: 'QR Code', icon: '📱' },
    { id: 'copy', label: 'Copia e Cola', icon: '📋' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/20 to-transparent blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent blur-3xl rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 w-full">
        <h2 className="text-5xl font-bold text-center mb-4 text-white">
          Experimente a Transferência Perfeita
        </h2>
        <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
          Teste o nosso sistema de transferência PIX agora mesmo. Três formas diferentes, uma experiência incrível.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left - Method selector */}
          <div className="space-y-6">
            <div className="text-lg font-semibold text-white mb-4">Escolha o método:</div>
            
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id as any)}
                className={`w-full p-6 rounded-xl border-2 transition-all duration-300 ${
                  selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-gray-600/30 bg-gray-900/20 text-gray-400 hover:border-gray-500/50'
                }`}
              >
                <div className="text-3xl mb-2">{method.icon}</div>
                <div className="font-semibold">{method.label}</div>
              </button>
            ))}

            {/* Amount input */}
            <div className="pt-4 border-t border-gray-700">
              <label className="block text-sm text-gray-400 mb-3">Valor da Transferência</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700/50 text-white focus:outline-none focus:border-blue-500 focus:bg-gray-900/80 transition-colors"
                  placeholder="0,00"
                />
              </div>

              {/* Fee calculation */}
              <div className="mt-4 p-4 rounded-xl bg-gray-900/30 border border-gray-700/30">
                <div className="flex justify-between text-sm text-gray-400 mb-3">
                  <span>Taxa (0.5%):</span>
                  <span>R$ {(parseFloat(amount) * 0.005).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-white">
                  <span>Você transferirá:</span>
                  <span>R$ {parseFloat(amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Preview/Display */}
          <div className="relative">
            <div className="sticky top-20 space-y-6">
              <div className="h-96 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-purple-950/20 p-8 flex flex-col items-center justify-center backdrop-blur-xl">
                {selectedMethod === 'key' && (
                  <div className="text-center space-y-4 w-full">
                    <div className="text-4xl">🔑</div>
                    <h3 className="text-xl font-semibold text-white">Selecione uma Chave</h3>
                    <div className="space-y-2 pt-4">
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 cursor-pointer transition-colors">
                        CPF: 123.456.789-10
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 cursor-pointer transition-colors">
                        Email: usuario@example.com
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 cursor-pointer transition-colors">
                        Telefone: (11) 99999-9999
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === 'qr' && (
                  <div className="text-center space-y-4">
                    <QrCode className="w-24 h-24 text-blue-400 mx-auto" />
                    <h3 className="text-xl font-semibold text-white">Aponte sua câmera</h3>
                    <p className="text-sm text-gray-400">Nosso scanner de IA detecta QR codes automaticamente</p>
                  </div>
                )}

                {selectedMethod === 'copy' && (
                  <div className="text-center space-y-4 w-full">
                    <Copy className="w-24 h-24 text-purple-400 mx-auto" />
                    <h3 className="text-xl font-semibold text-white">Cole a Chave PIX</h3>
                    <input
                      type="text"
                      placeholder="Cole sua chave aqui"
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-colors text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Transfer button */}
              <button
                onClick={handleTransfer}
                disabled={isProcessing || !amount}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Confirmar Transferência
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
