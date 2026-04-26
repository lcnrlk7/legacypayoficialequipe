"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import Image from "next/image";

const plates = [
  {
    amount: "10MIL",
    label: "10 Mil em Saques",
    image: "/images/plates/plate-10mil.jpg",
    iconColor: "text-zinc-400",
    borderColor: "border-zinc-600",
    textColor: "text-zinc-400",
  },
  {
    amount: "100MIL",
    label: "100 Mil em Saques",
    image: "/images/plates/plate-100mil.jpg",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/50",
    textColor: "text-amber-400",
  },
  {
    amount: "500MIL",
    label: "500 Mil em Saques",
    image: "/images/plates/plate-500mil.jpg",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/50",
    textColor: "text-emerald-400",
  },
  {
    amount: "1M",
    label: "1 Milhao em Saques",
    image: "/images/plates/plate-1m.jpg",
    iconColor: "text-primary",
    borderColor: "border-primary/50",
    textColor: "text-primary",
  },
];

export function AwardPlates() {
  return (
    <section className="py-24 relative overflow-hidden bg-black">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {plates.map((plate, index) => (
            <motion.div
              key={plate.amount}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:p-6 text-center hover:border-zinc-700 transition-all duration-300">
                {/* Amount Title */}
                <h3 className={`text-xl sm:text-2xl md:text-3xl font-black ${plate.textColor} mb-4`}>
                  {plate.amount}
                </h3>
                
                {/* Plate Image */}
                <div className="relative w-full aspect-square max-w-[160px] mx-auto mb-4 rounded-xl overflow-hidden">
                  <Image
                    src={plate.image}
                    alt={`Placa ${plate.amount}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                {/* Trophy Icon */}
                <div className={`w-12 h-12 mx-auto mb-3 bg-zinc-900 rounded-xl flex items-center justify-center border ${plate.borderColor}`}>
                  <Trophy className={`w-6 h-6 ${plate.iconColor}`} />
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
