import { Header } from "@/components/landing/header";
import { HeroLiquidFinance } from "@/components/landing/hero-liquid-finance";
import { LiquidBackground } from "@/components/landing/liquid-background";
import { InteractiveMeshGrid } from "@/components/landing/interactive-mesh-grid";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background effects layer */}
      <LiquidBackground />
      <InteractiveMeshGrid />

      {/* Content layer */}
      <div className="relative z-20">
        <Header />
        <HeroLiquidFinance />
        <DashboardPreview />
        <FAQ />
        <Footer />
      </div>
    </main>
  );
}
