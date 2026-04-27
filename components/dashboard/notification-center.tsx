"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, Trash2, ArrowDownLeft, ArrowUpRight, UserCheck, Settings, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, NotificationData } from "@/hooks/use-notifications";

const getNotificationIcon = (type: NotificationData["type"]) => {
  switch (type) {
    case "deposit":
    case "transaction":
      return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
    case "withdrawal":
      return <ArrowUpRight className="w-5 h-5 text-orange-500" />;
    case "pix":
      return <ArrowLeftRight className="w-5 h-5 text-primary" />;
    case "kyc":
      return <UserCheck className="w-5 h-5 text-blue-500" />;
    case "success":
      return <Check className="w-5 h-5 text-green-500" />;
    case "error":
      return <X className="w-5 h-5 text-red-500" />;
    case "warning":
      return <Bell className="w-5 h-5 text-yellow-500" />;
    case "system":
    case "info":
    default:
      return <Settings className="w-5 h-5 text-primary" />;
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
};

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Notificações</h2>
                  <p className="text-sm text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} não lidas` : "Tudo em dia"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-primary"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Marcar lidas
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearNotifications}
                        className="text-muted-foreground"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                      <Bell className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-center">
                      Nenhuma notificação
                    </p>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                      Suas notificações aparecerão aqui
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 cursor-pointer transition-colors ${
                          notification.read
                            ? "bg-transparent"
                            : "bg-primary/5"
                        } hover:bg-secondary/50`}
                      >
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`font-medium ${notification.read ? "text-foreground" : "text-foreground"}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.body}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
