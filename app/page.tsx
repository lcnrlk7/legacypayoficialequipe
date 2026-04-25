import { Header } from "@/components/landing/header";
import { HeroLiquidFinance } from "@/components/landing/hero-liquid-finance";
import { LiquidBackground } from "@/components/landing/liquid-background";
import { InteractiveMeshGrid } from "@/components/landing/interactive-mesh-grid";
import { FloatingPhysicsCards } from "@/components/landing/floating-physics-cards";
import { OrbitingStats } from "@/components/landing/orbiting-stats";
import { ProductDemoPlayground } from "@/components/landing/product-demo-playground";
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
        <FloatingPhysicsCards />
        <OrbitingStats />
        <ProductDemoPlayground />
        <FAQ />
        <Footer />
      </div>
    </main>
  );
}
