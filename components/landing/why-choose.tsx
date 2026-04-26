"use client";

import { motion } from "framer-motion";
import { Percent, Globe, Zap, CreditCard } from "lucide-react";

const benefits = [
  {
    icon: Percent,
    title: "Taxas que fazem sentido para quem vende muito",
    description: "Na LegacyPay, aplicamos taxas realmente justas, sempre. A taxa varia de 0% a 1% por venda, sem taxas escondidas.",
    highlight: true,
  },
  {
    icon: Globe,
    title: "Venda para o mundo inteiro",
    description: "Expanda suas vendas para novos mercados. Aceite pagamentos em multiplas moedas com conversao automatica.",
  },
  {
    icon: Zap,
    title: "Dinheiro mais rapido no seu caixa",
    description: "Pix D+0. Receba em ate 10 dias uteis no cartao (sem parcelas) ou em 30 dias com parcelas.",
  },
  {
    icon: CreditCard,
    title: "Mais formas de pagamento, mais conversao",
    description: "Ofereaca as opcoes de pagamento que seu publico Pix, Cartao de Credito, Boleto, debito auto, e mais.",
  },
];

export function WhyChoose() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-24"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Por que escolher a LegacyPay?
            </h2>
            
            <p className="text-muted-foreground text-lg mb-4">
              A plataforma feita para quem <span className="text-primary font-semibold">quer escalar de verdade.</span>
            </p>
            
            <p className="text-muted-foreground mb-6">
              A LegacyPay combina taxas competitivas, vendas internacionais e recebimento rapido para que voce fique com a maior parte do seu lucro.
            </p>
            
            <p className="text-primary font-medium mb-2">Sem burocracia. Sem limitacoes.</p>
            <p className="text-muted-foreground mb-8">Apenas estrutura para escalar.</p>
            
            <button className="px-6 py-3 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 transition-colors">
              Crie sua conta na LegacyPay
            </button>
          </motion.div>

          {/* Right Side - Benefit Cards */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  benefit.highlight 
                    ? "bg-gradient-to-r from-primary/20 to-orange-600/10 border-primary/30" 
                    : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    benefit.highlight ? "bg-primary/20" : "bg-zinc-800"
                  }`}>
                    <benefit.icon className={`w-6 h-6 ${benefit.highlight ? "text-primary" : "text-zinc-400"}`} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
