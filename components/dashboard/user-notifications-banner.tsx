"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Gift,
  ArrowLeftRight,
  ChevronRight,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface UserNotificationsBannerProps {
  userId: string;
}

const typeConfig: Record<string, { icon: typeof Info; color: string; bgColor: string }> = {
  info: { icon: Info, color: "text-blue-400", bgColor: "bg-blue-400/10" },
  success: { icon: CheckCircle, color: "text-green-400", bgColor: "bg-green-400/10" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bgColor: "bg-yellow-400/10" },
  error: { icon: AlertCircle, color: "text-red-400", bgColor: "bg-red-400/10" },
  reward: { icon: Gift, color: "text-primary", bgColor: "bg-primary/10" },
  transaction: { icon: ArrowLeftRight, color: "text-purple-400", bgColor: "bg-purple-400/10" },
};

export function UserNotificationsBanner({ userId }: UserNotificationsBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  async function loadNotifications() {
    try {
      const response = await fetch('/api/user/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  async function dismissNotification(id: string) {
    try {
      await fetch('/api/user/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss', notificationId: id }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }

  async function dismissAll() {
    try {
      const ids = notifications.map((n) => n.id);
      await fetch('/api/user/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss_all', notificationIds: ids }),
      });
      setNotifications([]);
      setShowAll(false);
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
    }
  }

  // Auto-rotate notifications
  useEffect(() => {
    if (notifications.length <= 1 || showAll) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notifications.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [notifications.length, showAll]);

  if (notifications.length === 0 || !isVisible) {
    return null;
  }

  const currentNotification = notifications[currentIndex];
  const config = typeConfig[currentNotification?.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <>
      {/* Single Notification Banner */}
      <AnimatePresence mode="wait">
        {!showAll && currentNotification && (
          <motion.div
            key={currentNotification.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`${config.bgColor} border border-border rounded-xl p-4 mb-4`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium text-foreground truncate">
                    {currentNotification.title}
                  </h4>
                  <div className="flex items-center gap-2 shrink-0">
                    {notifications.length > 1 && (
                      <button
                        onClick={() => setShowAll(true)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        +{notifications.length - 1}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => dismissNotification(currentNotification.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {currentNotification.message}
                </p>
              </div>
            </div>

            {/* Progress dots */}
            {notifications.length > 1 && (
              <div className="flex items-center justify-center gap-1 mt-3">
                {notifications.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === currentIndex ? "bg-primary" : "bg-foreground/20"
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Notifications Panel */}
      <AnimatePresence>
        {showAll && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-xl mb-4 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  Notificações ({notifications.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={dismissAll}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar todas
                </button>
                <button
                  onClick={() => setShowAll(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.map((notification) => {
                const notifConfig = typeConfig[notification.type] || typeConfig.info;
                const NotifIcon = notifConfig.icon;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-4 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${notifConfig.bgColor}`}>
                        <NotifIcon className={`w-4 h-4 ${notifConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-foreground text-sm">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="text-muted-foreground hover:text-foreground shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {new Date(notification.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
