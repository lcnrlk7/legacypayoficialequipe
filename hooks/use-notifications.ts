"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";

export type NotificationPermission = "default" | "granted" | "denied";

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: "deposit" | "withdrawal" | "transaction" | "pix" | "kyc" | "system" | "success" | "error" | "warning" | "info";
  read: boolean;
  createdAt: Date;
  data?: Record<string, unknown>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastNotificationCount = useRef(0);

  // Buscar notificacoes do banco de dados com polling a cada 5 segundos
  const { data, mutate } = useSWR("/api/user/notifications", fetcher, {
    refreshInterval: 5000, // Atualiza a cada 5 segundos
    revalidateOnFocus: true,
  });

  const notifications: NotificationData[] = (data?.notifications || []).map((n: Record<string, unknown>) => ({
    id: n.id as string,
    title: n.title as string,
    body: n.message as string,
    type: n.type as NotificationData["type"],
    read: n.read as boolean,
    createdAt: new Date(n.created_at as string),
    data: n.data as Record<string, unknown> | undefined,
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Inicializar audio e verificar suporte a notificacoes
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Verificar suporte a notificacoes do browser
      if ("Notification" in window) {
        setIsSupported(true);
        setPermission(Notification.permission as NotificationPermission);
      }

      // Criar elemento de audio para som de notificacao
      audioRef.current = new Audio("/sounds/notification.mp3");
      audioRef.current.volume = 0.5;
    }
  }, []);

  // Tocar som e mostrar notificacao quando chegar nova notificacao
  useEffect(() => {
    if (unreadCount > lastNotificationCount.current && lastNotificationCount.current > 0) {
      // Nova notificacao chegou
      playNotificationSound();
      
      // Mostrar notificacao do browser se permitido
      const latestNotification = notifications.find(n => !n.read);
      if (latestNotification && permission === "granted") {
        showBrowserNotification(latestNotification.title, latestNotification.body);
      }
    }
    lastNotificationCount.current = unreadCount;
  }, [unreadCount, notifications, permission]);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignorar erro se o usuario nao interagiu ainda com a pagina
      });
    }
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (!isSupported || permission !== "granted") return;
    
    try {
      new Notification(title, {
        body,
        icon: "/logo-icon.png",
        badge: "/logo-icon.png",
        tag: "legacypay-notification",
        renotify: true,
      });
    } catch (error) {
      console.error("Erro ao mostrar notificacao:", error);
    }
  }, [isSupported, permission]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      return result === "granted";
    } catch (error) {
      console.error("Erro ao solicitar permissao de notificacao:", error);
      return false;
    }
  }, [isSupported]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch("/api/user/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss", notificationId: id }),
      });
      mutate();
    } catch (error) {
      console.error("Erro ao marcar notificacao como lida:", error);
    }
  }, [mutate]);

  const markAllAsRead = useCallback(async () => {
    try {
      const notificationIds = notifications.filter(n => !n.read).map(n => n.id);
      if (notificationIds.length === 0) return;
      
      await fetch("/api/user/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss_all", notificationIds }),
      });
      mutate();
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  }, [notifications, mutate]);

  const clearNotifications = useCallback(async () => {
    try {
      const notificationIds = notifications.map(n => n.id);
      if (notificationIds.length === 0) return;
      
      await fetch("/api/user/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss_all", notificationIds }),
      });
      mutate();
    } catch (error) {
      console.error("Erro ao limpar notificacoes:", error);
    }
  }, [notifications, mutate]);

  const refreshNotifications = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    isSupported,
    permission,
    notifications,
    unreadCount,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    refreshNotifications,
    playNotificationSound,
  };
}
