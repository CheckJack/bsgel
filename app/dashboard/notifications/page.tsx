"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useLanguage } from "@/contexts/language-context";
import { resolveNotificationCopy } from "@/lib/notifications/i18n";
import { cn } from "@/lib/utils";

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
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-black/30" />
        </div>
      }
    >
      <NotificationsPageContent />
    </Suspense>
  );
}

function NotificationsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const openHandled = useRef<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      fetchNotifications();
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
        toast(error.error || t("clientPanel.notifications.loadFailed"), "error");
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
        toast(error.error || t("clientPanel.notifications.markReadFailed"), "error");
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast(t("clientPanel.notifications.markReadFailedRetry"), "error");
    } finally {
      setMarkingAsRead(null);
    }
  };

  // Open a specific notification from the header dropdown (?open=id)
  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId || notifications.length === 0) return;
    if (openHandled.current === openId) return;

    const exists = notifications.some((n) => n.id === openId);
    if (!exists) return;

    openHandled.current = openId;
    setExpandedId(openId);

    const target = notifications.find((n) => n.id === openId);
    if (target && !target.read) {
      void markAsRead(openId);
    }

    // Scroll after expand renders
    requestAnimationFrame(() => {
      itemRefs.current[openId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [searchParams, notifications]);

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast(t("clientPanel.notifications.markAllReadSuccess"), "success");
      } else {
        const error = await res.json();
        toast(error.error || t("clientPanel.notifications.markAllReadFailed"), "error");
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast(t("clientPanel.notifications.markAllReadFailedRetry"), "error");
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
        setExpandedId(null);
        toast(t("clientPanel.notifications.deleteAllSuccess"), "success");
      } else {
        const error = await res.json();
        toast(error.error || t("clientPanel.notifications.deleteAllFailed"), "error");
      }
    } catch (error) {
      console.error("Failed to delete notifications:", error);
      toast(t("clientPanel.notifications.deleteAllFailedRetry"), "error");
    } finally {
      setDeletingAll(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t("chat.justNow");
    if (diffInSeconds < 3600) {
      return t("chat.minutesAgo", { minutes: String(Math.floor(diffInSeconds / 60)) });
    }
    if (diffInSeconds < 86400) {
      return t("chat.hoursAgo", { hours: String(Math.floor(diffInSeconds / 3600)) });
    }
    if (diffInSeconds < 604800) {
      return t("chat.daysAgo", { days: String(Math.floor(diffInSeconds / 86400)) });
    }

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const formatFullTime = (dateString: string) =>
    new Date(dateString).toLocaleString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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

  const getExtraDetails = (notification: Notification) => {
    const reason = notification.metadata?.reason as string | undefined;
    const changes = (notification.metadata?.changes as string[] | undefined) || [];
    return { reason, changes };
  };

  const toggleExpanded = (id: string, unread: boolean) => {
    setExpandedId((prev) => (prev === id ? null : id));
    if (unread) {
      void markAsRead(id);
    }
  };

  const openRelatedLink = (linkUrl: string) => {
    if (linkUrl.startsWith("http://") || linkUrl.startsWith("https://")) {
      window.open(linkUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(linkUrl);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-black/30" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-header text-3xl font-semibold tracking-tight text-brand-black sm:text-4xl">
            {t("clientPanel.notifications.title")}
          </h1>
          <p className="mt-1.5 text-sm text-brand-black/55">
            {unreadCount > 0
              ? t("clientPanel.notifications.unreadCount", {
                  count: String(unreadCount),
                  plural: unreadCount !== 1 ? "s" : "",
                })
              : t("clientPanel.notifications.allCaughtUp")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="rounded-none">
              <CheckCheck className="mr-2 h-4 w-4" />
              {t("clientPanel.notifications.markAllAsRead")}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={deleteAllNotifications}
              disabled={deletingAll}
              className="rounded-none text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {deletingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("clientPanel.notifications.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("clientPanel.notifications.deleteAll")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="border border-[#e8e4de] bg-brand-white px-6 py-14 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-brand-black/20" />
          <p className="font-header text-base font-medium text-brand-black">
            {t("clientPanel.notifications.noNotificationsYet")}
          </p>
          <p className="mt-1 text-sm text-brand-black/50">
            {t("clientPanel.notifications.seeUpdates")}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#e8e4de] border border-[#e8e4de] bg-brand-white">
          {notifications.map((notification) => {
            const copy = resolveNotificationCopy(notification, t);
            const { reason, changes } = getExtraDetails(notification);
            const isUnread = !notification.read;
            const isExpanded = expandedId === notification.id;
            const preview =
              copy.message.length > 120
                ? `${copy.message.slice(0, 120).trim()}…`
                : copy.message;

            return (
              <li
                key={notification.id}
                ref={(el) => {
                  itemRefs.current[notification.id] = el;
                }}
                className={cn(
                  "transition-colors",
                  isUnread && "bg-brand-champagne/[0.06]",
                  isExpanded && "bg-[#faf9f7]"
                )}
              >
                <div className="flex gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                  {notification.image ? (
                    <img
                      src={notification.image}
                      alt=""
                      className="h-11 w-11 flex-shrink-0 rounded-md object-cover sm:h-12 sm:w-12"
                    />
                  ) : (
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-brand-black/[0.04] text-xl sm:h-12 sm:w-12 sm:text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => toggleExpanded(notification.id, isUnread)}
                        aria-expanded={isExpanded}
                      >
                        <div className="flex min-w-0 items-start gap-2">
                          {isUnread && (
                            <span
                              className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-champagne"
                              aria-hidden
                            />
                          )}
                          <h3
                            className={cn(
                              "font-header text-[15px] leading-snug text-brand-black",
                              isUnread ? "font-semibold" : "font-medium"
                            )}
                          >
                            {copy.title}
                          </h3>
                        </div>
                        {!isExpanded && (
                          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-brand-black/65">
                            {preview}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-brand-black/40">
                          {formatTime(notification.time)}
                        </p>
                      </button>

                      <div className="flex flex-shrink-0 items-center gap-1">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            disabled={markingAsRead === notification.id}
                            className="rounded p-1.5 text-brand-black/45 transition-colors hover:bg-brand-black/5 hover:text-brand-black"
                            aria-label={t("clientPanel.notifications.markAsRead")}
                            title={t("clientPanel.notifications.markAsRead")}
                          >
                            {markingAsRead === notification.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleExpanded(notification.id, isUnread)}
                          className="inline-flex items-center gap-1 rounded border border-[#e8e4de] bg-white px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-brand-champagne transition-colors hover:border-brand-champagne/50 hover:text-brand-black"
                          aria-expanded={isExpanded}
                        >
                          {isExpanded
                            ? t("clientPanel.notifications.showLess")
                            : t("clientPanel.notifications.showMore")}
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-3 border-t border-[#e8e4de] pt-4">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-brand-champagne">
                            {t("clientPanel.notifications.message")}
                          </p>
                          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-brand-black/75">
                            {copy.message}
                          </p>
                        </div>

                        {reason && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-brand-champagne">
                              {t("clientPanel.notifications.reasonForChanges")}
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed text-brand-black/75">
                              {reason}
                            </p>
                          </div>
                        )}

                        {changes.length > 0 && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-brand-champagne">
                              {t("clientPanel.notifications.changesRequired")}
                            </p>
                            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm leading-relaxed text-brand-black/75">
                              {changes.map((change, index) => (
                                <li key={index} className="whitespace-pre-line">
                                  {change}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-brand-champagne">
                            {t("clientPanel.notifications.receivedAt")}
                          </p>
                          <p className="mt-1.5 text-sm text-brand-black/65">
                            {formatFullTime(notification.time)}
                          </p>
                        </div>

                        {notification.linkUrl ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-none border-[#e8e4de]"
                            onClick={() => openRelatedLink(notification.linkUrl!)}
                          >
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            {t("clientPanel.notifications.relatedLink")}
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
