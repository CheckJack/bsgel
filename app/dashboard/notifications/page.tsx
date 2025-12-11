"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, Loader2, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  image?: string;
  time: string;
  type: string;
  read: boolean;
  linkUrl?: string;
  metadata?: any;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      fetchNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session, status, router]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      } else {
        const error = await res.json();
        toast(error.error || "Failed to load notifications", "error");
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setMarkingAsRead(notificationId);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, read: true }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      } else {
        const error = await res.json();
        toast(error.error || "Failed to mark notification as read", "error");
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast("Failed to mark notification as read. Please try again.", "error");
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast("All notifications marked as read", "success");
      } else {
        const error = await res.json();
        toast(error.error || "Failed to mark all as read", "error");
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast("Failed to mark all as read. Please try again.", "error");
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
        toast("All notifications deleted successfully", "success");
      } else {
        const error = await res.json();
        toast(error.error || "Failed to delete notifications", "error");
      }
    } catch (error) {
      console.error("Failed to delete notifications:", error);
      toast("Failed to delete notifications. Please try again.", "error");
    } finally {
      setDeletingAll(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
      case "order_status":
      case "order_shipped":
      case "order_delivered":
        return "📦";
      case "system":
        return "⚙️";
      case "salon_approved":
        return "✅";
      case "salon_rejected":
        return "❌";
      default:
        return "🔔";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.linkUrl) {
      if (notification.linkUrl.startsWith("/")) {
        router.push(notification.linkUrl);
      } else {
        window.open(notification.linkUrl, "_blank");
      }
    } else if (notification.metadata?.orderId) {
      router.push(`/dashboard/orders/${notification.metadata.orderId}`);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={deleteAllNotifications}
              disabled={deletingAll}
            >
              {deletingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
              No notifications yet.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              You&apos;ll see order updates and important messages here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${
                !notification.read
                  ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                  : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {notification.image ? (
                    <img
                      src={notification.image}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          disabled={markingAsRead === notification.id}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                          aria-label="Mark as read"
                        >
                          {markingAsRead === notification.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          ) : (
                            <Check className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(notification.time)}
                      </span>
                      {(notification.linkUrl || notification.metadata?.orderId) && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          View details
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

