"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: "top" | "bottom" | "left" | "right";
  action?: string;
}

interface OnboardingContextType {
  isOnboardingActive: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  hasCompletedOnboarding: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao LegacyPay!",
    description: "Vamos fazer um tour rapido pela plataforma para voce conhecer todas as funcionalidades.",
    target: "[data-onboarding='dashboard']",
    position: "bottom",
  },
  {
    id: "balance",
    title: "Seu Saldo",
    description: "Aqui voce ve seu saldo disponivel para saque e o saldo bloqueado (em processamento).",
    target: "[data-onboarding='stats-cards']",
    position: "bottom",
  },
  {
    id: "chart",
    title: "Grafico de Vendas",
    description: "Acompanhe a evolucao das suas vendas em tempo real com graficos interativos.",
    target: "[data-onboarding='sales-chart']",
    position: "top",
  },
  {
    id: "sidebar",
    title: "Menu de Navegacao",
    description: "Use o menu lateral para acessar todas as funcionalidades: carteira, transacoes, checkout e mais.",
    target: "[data-onboarding='sidebar']",
    position: "right",
  },
  {
    id: "wallet",
    title: "Carteira",
    description: "Na carteira voce pode solicitar saques e ver seu historico de movimentacoes.",
    target: "[data-onboarding='wallet-link']",
    position: "right",
  },
  {
    id: "integration",
    title: "Integracao API",
    description: "Conecte seu sistema usando nossa API. Copie sua chave secreta e siga a documentacao.",
    target: "[data-onboarding='api-link']",
    position: "right",
  },
  {
    id: "support",
    title: "Suporte",
    description: "Precisa de ajuda? Abra um ticket de suporte ou fale conosco pelo Discord/WhatsApp.",
    target: "[data-onboarding='support-link']",
    position: "right",
  },
  {
    id: "complete",
    title: "Pronto para comecar!",
    description: "Agora voce conhece o basico. Explore a plataforma e comece a receber pagamentos!",
    target: "[data-onboarding='dashboard']",
    position: "bottom",
  },
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem("lp_onboarding_completed");
    setHasCompletedOnboarding(completed === "true");
  }, []);

  const startOnboarding = () => {
    setCurrentStep(0);
    setIsOnboardingActive(true);
  };

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const skipOnboarding = () => {
    setIsOnboardingActive(false);
    localStorage.setItem("lp_onboarding_completed", "true");
    setHasCompletedOnboarding(true);
  };

  const completeOnboarding = () => {
    setIsOnboardingActive(false);
    localStorage.setItem("lp_onboarding_completed", "true");
    setHasCompletedOnboarding(true);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingActive,
        currentStep,
        steps: ONBOARDING_STEPS,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        hasCompletedOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
