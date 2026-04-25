import { Header } from "@/components/landing/header";
import { HeroNew } from "@/components/landing/hero-new";
import { FeaturesNew } from "@/components/landing/features-new";
import { BenefitsNew } from "@/components/landing/benefits-new";
import { PricingNew } from "@/components/landing/pricing-new";
import { CTANew } from "@/components/landing/cta-new";
import { AnimatedParticles } from "@/components/landing/animated-particles";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedParticles />
      <Header />
      <HeroNew />
      <FeaturesNew />
      <BenefitsNew />
      <PricingNew />
      <CTANew />
      <FAQ />
      <Footer />
    </main>
  );
}
