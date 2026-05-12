"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useOnboarding } from "./onboarding-provider";
import { Button } from "@/components/ui/button";

export function OnboardingOverlay() {
  const {
    isOnboardingActive,
    currentStep,
    steps,
    nextStep,
    prevStep,
    skipOnboarding,
  } = useOnboarding();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isOnboardingActive || !currentStepData) return;

    const updatePosition = () => {
      const target = document.querySelector(currentStepData.target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);

        // Calcular posicao do tooltip
        const tooltipWidth = 320;
        const tooltipHeight = 180;
        const padding = 16;

        let x = 0;
        let y = 0;

        switch (currentStepData.position) {
          case "top":
            x = rect.left + rect.width / 2 - tooltipWidth / 2;
            y = rect.top - tooltipHeight - padding;
            break;
          case "bottom":
            x = rect.left + rect.width / 2 - tooltipWidth / 2;
            y = rect.bottom + padding;
            break;
          case "left":
            x = rect.left - tooltipWidth - padding;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
          case "right":
            x = rect.right + padding;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
        }

        // Ajustar para nao sair da tela
        x = Math.max(padding, Math.min(x, window.innerWidth - tooltipWidth - padding));
        y = Math.max(padding, Math.min(y, window.innerHeight - tooltipHeight - padding));

        setTooltipPosition({ x, y });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isOnboardingActive, currentStep, currentStepData]);

  if (!isOnboardingActive) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Overlay escuro com buraco */}
        <svg className="absolute inset-0 w-full h-full pointer-events-auto">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Borda do spotlight */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute pointer-events-none"
            style={{
              left: targetRect.left - 8,
              top: targetRect.top - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          >
            <div className="w-full h-full rounded-xl border-2 border-primary animate-pulse" />
          </motion.div>
        )}

        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute pointer-events-auto"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            width: 320,
          }}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Passo {currentStep + 1} de {steps.length}
                  </span>
                </div>
                <button
                  onClick={skipOnboarding}
                  className="p-1 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {currentStepData?.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStepData?.description}
              </p>
            </div>

            {/* Progress */}
            <div className="px-4 pb-2">
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      index <= currentStep ? "bg-primary" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 pt-2 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              <Button
                size="sm"
                onClick={nextStep}
                className="gap-1 bg-primary hover:bg-primary/90"
              >
                {currentStep === steps.length - 1 ? "Concluir" : "Proximo"}
                {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
