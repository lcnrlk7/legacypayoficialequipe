"use client";

import { useState, useEffect, useCallback } from "react";

export type NotificationPermission = "default" | "granted" | "denied";

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: "transaction" | "pix" | "kyc" | "system";
  read: boolean;
  createdAt: Date;
  data?: Record<string, unknown>;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Check if notifications are supported
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission as NotificationPermission);
    }

    // Load notifications from localStorage
    const stored = localStorage.getItem("legacypay_notifications");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: NotificationData) => !n.read).length);
      } catch (e) {
        console.error("Error parsing notifications:", e);
      }
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      
      if (result === "granted") {
        // Register service worker
        if ("serviceWorker" in navigator) {
          await navigator.serviceWorker.register("/sw.js");
        }
      }
      
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions & { type?: NotificationData["type"]; data?: Record<string, unknown> }) => {
      if (!isSupported || permission !== "granted") return;

      // Create notification
      const notification = new Notification(title, {
        icon: "/logo-icon.png",
        badge: "/logo-icon.png",
        ...options,
      });

      // Add to local state
      const newNotification: NotificationData = {
        id: Date.now().toString(),
        title,
        body: options?.body || "",
        type: options?.type || "system",
        read: false,
        createdAt: new Date(),
        data: options?.data,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev].slice(0, 50); // Keep last 50
        localStorage.setItem("legacypay_notifications", JSON.stringify(updated));
        return updated;
      });
      
      setUnreadCount((prev) => prev + 1);

      return notification;
    },
    [isSupported, permission]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      localStorage.setItem("legacypay_notifications", JSON.stringify(updated));
      return updated;
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem("legacypay_notifications", JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem("legacypay_notifications");
  }, []);

  return {
    isSupported,
    permission,
    notifications,
    unreadCount,
    requestPermission,
    sendNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
