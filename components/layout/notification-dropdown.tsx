"use client";

import { Bell, X, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import {
  headerNavActionClass,
  headerNavBadgeClass,
  headerNavIconClass,
} from "@/components/layout/header-nav-actions";

interface Notification {
  id: string;
  title: string;
  message: string;
  image?: string | null;
  time: string;
  type: string;
  read: boolean;
  linkUrl?: string;
  metadata?: any;
}

export function NotificationDropdown({
  onOpenChange,
}: {
  onOpenChange?: (open: boolean) => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingAll, setDeletingAll] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const setOpen = (open: boolean) => {
    setShowNotifications(open);
    onOpenChange?.(open);
  };

  // Fetch notifications
  useEffect(() => {
    if (!session?.user) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications");
        const data = await response.json();

        if (response.ok) {
          const mappedNotifications: Notification[] = data.map((notif: any) => ({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            image: notif.image,
            time: new Date(notif.time).toLocaleString(),
            type: notif.type,
            read: notif.read,
            linkUrl: notif.linkUrl,
            metadata: notif.metadata,
          }));
          setNotifications(mappedNotifications);
          setUnreadCount(mappedNotifications.filter((n: Notification) => !n.read).length);
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId,
          read: true,
        }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    setOpen(false);

    if (notification.linkUrl) {
      if (notification.linkUrl.startsWith("http://") || notification.linkUrl.startsWith("https://")) {
        window.open(notification.linkUrl, "_blank", "noopener,noreferrer");
      } else {
        router.push(notification.linkUrl);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markAllAsRead: true,
        }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!confirm(t("clientPanel.notifications.deleteAllConfirm"))) {
      return;
    }

    setDeletingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
      });

      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        console.error("Failed to delete notifications");
      }
    } catch (error) {
      console.error("Failed to delete notifications:", error);
    } finally {
      setDeletingAll(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative flex items-center overflow-visible" ref={notificationRef}>
      <button
        onClick={() => setOpen(!showNotifications)}
        className={cn(headerNavActionClass, "relative")}
        aria-label={t("clientPanel.notifications.title")}
      >
        <Bell className={headerNavIconClass} aria-hidden />
        {unreadCount > 0 && (
          <span className={headerNavBadgeClass}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 top-full z-[1200] mt-3 flex max-h-96 w-80 flex-col overflow-hidden border border-black/10 bg-brand-white shadow-xl">
          <div className="flex items-center justify-between border-b border-black/10 p-4">
            <h3 className="font-header text-base font-semibold text-brand-black">
              {t("clientPanel.notifications.title")}
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              aria-label={t("clientPanel.notifications.close")}
            >
              <X className="h-4 w-4 text-brand-black/60" />
            </button>
          </div>

          <div className="notification-scroll flex-1 overflow-y-auto pr-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto mb-4 h-12 w-12 text-brand-black/20" />
                <p className="text-sm font-medium text-brand-black">
                  {t("clientPanel.notifications.noNotificationsYet")}
                </p>
                <p className="mt-1 text-xs text-brand-black/55">
                  {t("clientPanel.notifications.seeUpdates")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-black/10">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "cursor-pointer p-4 transition-colors hover:bg-black/5",
                      !notification.read && "bg-brand-champagne/5"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {notification.image ? (
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-black/10">
                          <img
                            src={notification.image}
                            alt={notification.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "mt-2 h-2 w-2 flex-shrink-0 rounded-full",
                            !notification.read ? "bg-brand-champagne" : "bg-brand-black/20"
                          )}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-black">{notification.title}</p>
                        <p className="mt-1 text-sm text-brand-black/70">{notification.message}</p>
                        <p className="mt-2 text-xs text-brand-black/45">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-black/10 p-3">
              <div className="flex gap-2">
                <button
                  onClick={markAllAsRead}
                  className="flex-1 border-r border-black/10 py-2 text-center text-sm font-medium text-brand-black transition-colors hover:text-brand-champagne-dark"
                >
                  {t("clientPanel.notifications.markAllAsRead")}
                </button>
                <button
                  onClick={deleteAllNotifications}
                  disabled={deletingAll}
                  className="flex flex-1 items-center justify-center gap-2 py-2 text-center text-sm font-medium text-red-600 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  {deletingAll
                    ? t("clientPanel.notifications.deleting")
                    : t("clientPanel.notifications.deleteAll")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
