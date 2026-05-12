"use client";

import { useEffect, useRef, useCallback } from "react";
import { notificationSound } from "@/lib/notification-sound";

interface NotificationListenerProps {
  userId: string;
  onNewPayment?: (payment: { amount: number; description: string }) => void;
}

export function NotificationListener({ userId, onNewPayment }: NotificationListenerProps) {
  const lastCheckRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkNewPayments = useCallback(async () => {
    try {
      const response = await fetch(`/api/user/transactions/latest?userId=${userId}`);
      if (!response.ok) return;

      const data = await response.json();
      if (!data.transaction) return;

      const latestId = data.transaction.id;

      // Se e a primeira verificacao, apenas salvar o ID
      if (lastCheckRef.current === null) {
        lastCheckRef.current = latestId;
        return;
      }

      // Se o ID mudou, significa que tem novo pagamento
      if (lastCheckRef.current !== latestId && data.transaction.type === "payment") {
        lastCheckRef.current = latestId;

        // Tocar som
        await notificationSound.playPaymentReceived();

        // Mostrar notificacao do navegador se permitido
        if (Notification.permission === "granted") {
          const amount = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(data.transaction.amount);

          new Notification("Pagamento Recebido!", {
            body: `Voce recebeu ${amount}`,
            icon: "/logo.png",
            tag: "payment-received",
          });
        }

        // Callback opcional
        if (onNewPayment) {
          onNewPayment({
            amount: data.transaction.amount,
            description: data.transaction.description || "Pagamento PIX",
          });
        }
      }
    } catch (error) {
      console.error("[NotificationListener] Erro:", error);
    }
  }, [userId, onNewPayment]);

  useEffect(() => {
    // Solicitar permissao de notificacao
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    // Verificar a cada 10 segundos
    checkNewPayments();
    intervalRef.current = setInterval(checkNewPayments, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkNewPayments]);

  // Componente invisivel, apenas escuta
  return null;
}
