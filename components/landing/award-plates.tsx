"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

const plates = [
  {
    amount: "10MIL",
    label: "10 Mil",
    iconColor: "text-zinc-400",
    gradientFrom: "from-zinc-400",
    gradientTo: "to-zinc-300",
    glowColor: "shadow-zinc-500/20",
  },
  {
    amount: "100MIL",
    label: "100 Mil",
    iconColor: "text-amber-400",
    gradientFrom: "from-amber-500",
    gradientTo: "to-yellow-400",
    glowColor: "shadow-amber-500/20",
  },
  {
    amount: "500MIL",
    label: "500 Mil",
    iconColor: "text-emerald-400",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-green-400",
    glowColor: "shadow-emerald-500/20",
  },
  {
    amount: "1M",
    label: "1 Milhao",
    iconColor: "text-primary",
    gradientFrom: "from-primary",
    gradientTo: "to-orange-400",
    glowColor: "shadow-primary/20",
  },
];

export function AwardPlates() {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-zinc-950 to-black">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-sm rounded-full mb-6">
            Premiacoes
          </span>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Placas de </span>
            <span className="text-primary">Premiacao LegacyPay</span>
          </h2>
          
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Seja premiado por faturar com a LegacyPay
          </p>
        </motion.div>

        {/* Plates Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {plates.map((plate, index) => (
            <motion.div
              key={plate.amount}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className={`relative bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 text-center hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl ${plate.glowColor}`}>
                {/* Amount */}
                <h3 className={`text-2xl sm:text-3xl font-black bg-gradient-to-b ${plate.gradientFrom} ${plate.gradientTo} bg-clip-text text-transparent mb-4`}>
                  {plate.amount}
                </h3>
                
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${plate.gradientFrom} ${plate.gradientTo} opacity-20 rounded-xl blur-lg group-hover:opacity-40 transition-opacity`} />
                  <div className="relative w-full h-full bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                    <Trophy className={`w-8 h-8 ${plate.iconColor}`} />
                  </div>
                </div>
                
                {/* Label */}
                <p className="text-xs text-zinc-500">LegacyPay</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
