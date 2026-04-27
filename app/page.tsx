import { Header } from "@/components/landing/header";
import { HeroClean } from "@/components/landing/hero-clean";
import { Features } from "@/components/landing/features";
import { RewardsProgram } from "@/components/landing/rewards-program";
import { AwardPlates } from "@/components/landing/award-plates";
import { Integrations } from "@/components/landing/integrations";
import { WhyChoose } from "@/components/landing/why-choose";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Grid quadriculado laranja - tela toda */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 120, 0, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 120, 0, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Conteudo */}
      <div className="relative z-10">
        <Header />
        <HeroClean />
        <Features />
        <RewardsProgram />
        <AwardPlates />
        <Integrations />
        <WhyChoose />
        <FAQ />
        <Footer />
      </div>
    </main>
  );
}
