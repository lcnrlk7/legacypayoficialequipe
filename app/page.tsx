import { Header } from "@/components/landing/header";
import { HeroClean } from "@/components/landing/hero-clean";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] relative overflow-x-hidden">
      <Header />
      <HeroClean />
      <FAQ />
      <Footer />
    </main>
  );
}
