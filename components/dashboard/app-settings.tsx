"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Bell, Download, X, Check, Smartphone, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/use-pwa";
import { useNotifications } from "@/hooks/use-notifications";

export function AppSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const { isInstallable, isInstalled, installApp } = usePWA();
  const { isSupported, permission, requestPermission } = useNotifications();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    await installApp();
    setInstalling(false);
  };

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-full shadow-lg flex items-center justify-center z-40"
      >
        <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-overlay backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-card border border-border rounded-t-3xl md:rounded-2xl p-6 z-50 max-w-md w-full mx-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  Configurações do App
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Install App */}
                <div className="bg-secondary/50 rounded-2xl p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Download className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        Instalar App
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isInstalled
                          ? "App instalado no seu dispositivo"
                          : "Adicione à tela inicial"}
                      </p>
                    </div>
                    {isInstalled ? (
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    ) : isInstallable ? (
                      <Button
                        onClick={handleInstall}
                        disabled={installing}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        {installing ? "Instalando..." : "Instalar"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Use o menu do navegador
                      </span>
                    )}
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-secondary/50 rounded-2xl p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Bell className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        Notificações
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {permission === "granted"
                          ? "Notificações ativadas"
                          : permission === "denied"
                          ? "Notificações bloqueadas"
                          : "Receba alertas de transações"}
                      </p>
                    </div>
                    {!isSupported ? (
                      <span className="text-xs text-muted-foreground">
                        Não suportado
                      </span>
                    ) : permission === "granted" ? (
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    ) : permission === "denied" ? (
                      <span className="text-xs text-red-400">Bloqueado</span>
                    ) : (
                      <Button
                        onClick={handleEnableNotifications}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        Ativar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <BellRing className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-foreground font-medium">
                        Fique sempre atualizado
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Receba notificações instantâneas de PIX recebidos, saques concluídos e atualizações da sua conta.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Install Instructions */}
              {!isInstalled && !isInstallable && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-3">
                    Para instalar manualmente:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">1</span>
                      No Chrome/Edge: Menu (3 pontos) → Instalar app
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">2</span>
                      No Safari (iOS): Compartilhar → Adicionar à Tela de Início
                    </li>
                  </ul>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
