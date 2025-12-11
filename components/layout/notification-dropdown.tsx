"use client";

import { Bell, X, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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

export function NotificationDropdown() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingAll, setDeletingAll] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

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
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
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
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Close dropdown
    setShowNotifications(false);

    // Navigate to link if provided
    if (notification.linkUrl) {
      // Check if it's an external URL or internal
      if (notification.linkUrl.startsWith('http://') || notification.linkUrl.startsWith('https://')) {
        window.open(notification.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Internal route
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
    if (!confirm("Are you sure you want to delete all notifications? This action cannot be undone.")) {
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

  // Don't show if user is not logged in
  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative flex items-center overflow-visible" ref={notificationRef}>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative text-brand-white hover:text-brand-sweet-bianca transition-colors flex-shrink-0 flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-brand-sweet-bianca text-brand-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-3 w-80 bg-black/80 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700/50 z-[100] max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            <button
              onClick={() => setShowNotifications(false)}
              className="w-8 h-8 rounded-full hover:bg-gray-800/50 flex items-center justify-center transition-colors"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 notification-scroll pr-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-white">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/50">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-gray-800/30" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {notification.image ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-700/50">
                          <img
                            src={notification.image}
                            alt={notification.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            !notification.read
                              ? "bg-brand-sweet-bianca"
                              : "bg-gray-500"
                          }`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-white">
                            {notification.title}
                          </p>
                          {!notification.image && (
                            <div
                              className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                                !notification.read
                                  ? "bg-brand-sweet-bianca"
                                  : "bg-gray-500"
                              }`}
                            />
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700/50">
              <div className="flex gap-2">
                <button
                  onClick={markAllAsRead}
                  className="flex-1 text-sm text-center text-brand-sweet-bianca hover:text-brand-sweet-bianca/80 font-medium py-2 border-r border-gray-700/50 transition-colors"
                >
                  Mark all as read
                </button>
                <button
                  onClick={deleteAllNotifications}
                  disabled={deletingAll}
                  className="flex-1 text-sm text-center text-red-400 hover:text-red-300 font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  {deletingAll ? "Deleting..." : "Delete all"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

