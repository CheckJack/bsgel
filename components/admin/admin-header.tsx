"use client";

import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Bell, MessageCircle, Maximize2, Minimize2, Settings, Moon, Sun, Menu, X, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AccountSettingsMenu } from "./account-settings-menu";
import { useLanguage } from "@/contexts/language-context";

interface AdminHeaderProps {
  onMenuClick?: () => void;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  image?: string | null;
  time: string;
  type: "order" | "message" | "system";
  read: boolean;
}

interface ChatMessage {
  id: string;
  message: string;
  adminResponse: string | null;
  readByAdmin: boolean;
  readAt: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export function AdminHeader({ onMenuClick, onSidebarToggle, isSidebarCollapsed }: AdminHeaderProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notificationRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Initialize search query from URL params
    const query = searchParams.get("search") || "";
    setSearchQuery(query);
  }, [searchParams]);

  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "pt" : "en";
    setLanguage(newLanguage);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications");
        const data = await response.json();
        
        if (response.ok) {
          console.log("📬 Notifications received:", data.length, data);
          // Map API notifications to component format
          const mappedNotifications: Notification[] = data.map((notif: any) => ({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            image: notif.image,
            time: new Date(notif.time).toLocaleString(),
            type: notif.type === "new_customer" || notif.type === "new_professional_certification" 
              ? "system" 
              : notif.type === "order" 
              ? "order" 
              : "system",
            read: notif.read,
          }));
          console.log("📬 Mapped notifications:", mappedNotifications.length, mappedNotifications);
          setNotifications(mappedNotifications);
          setUnreadCount(mappedNotifications.filter((n: Notification) => !n.read).length);
        } else {
          console.error("❌ Failed to fetch notifications - Response not OK:", response.status, response.statusText);
          console.error("Error details:", data);
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("❌ Failed to fetch notifications:", error);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Fetch recent messages for the dropdown
        const recentResponse = await fetch("/api/chat?limit=10&sortField=createdAt&sortDirection=desc");
        const recentData = await recentResponse.json();
        
        // Fetch unread count
        const unreadResponse = await fetch("/api/chat?filter=unread&limit=100");
        const unreadData = await unreadResponse.json();
        
        if (recentResponse.ok) {
          const messagesData = recentData.messages || [];
          setMessages(messagesData);
        } else {
          console.error("Failed to fetch recent messages:", recentData);
          setMessages([]);
        }

        if (unreadResponse.ok) {
          const unreadMessages = unreadData.messages || [];
          setUnreadMessagesCount(unreadMessages.length);
        } else {
          console.error("Failed to fetch unread count:", unreadData);
          setUnreadMessagesCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setMessages([]);
        setUnreadMessagesCount(0);
      }
    };

    fetchMessages();
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const deleteAllNotifications = async () => {
    if (!confirm("Are you sure you want to delete all notifications? This action cannot be undone.")) {
      return;
    }

    setDeletingAll(true);
    try {
      // Use the main notifications endpoint which handles all notification types for admins
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
        setShowMessages(false);
      }
    };

    if (showNotifications || showMessages) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications, showMessages]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Update URL with search query
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    
    // Update URL without causing a full page reload
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Trigger a custom event that pages can listen to
    window.dispatchEvent(new CustomEvent("adminSearch", { detail: { query: searchQuery } }));
  };

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4 md:px-6">
      {/* Mobile Menu Button */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="md:hidden w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mr-2"
        >
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Desktop Sidebar Toggle Button */}
      {onSidebarToggle && (
        <button
          onClick={onSidebarToggle}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden md:block mr-2"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </form>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-2">
        {/* Language Selector */}
        <button
          onClick={toggleLanguage}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label={language === "en" ? t("header.switchToPortuguese") : t("header.switchToEnglish")}
          title={t("header.currentLanguage", { language: language === "en" ? t("header.english") : t("header.portuguese") })}
        >
          <span className="text-xl">{language === "en" ? "🇬🇧" : "🇵🇹"}</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t("header.notifications")}
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("header.noNotifications")}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                          !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                        onClick={async () => {
                          // Mark as read
                          if (!notification.read) {
                            try {
                              await fetch("/api/notifications", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  notificationId: notification.id,
                                  read: true,
                                }),
                              });
                            } catch (error) {
                              console.error("Failed to mark notification as read:", error);
                            }
                          }
                          setNotifications((prev) =>
                            prev.map((n) =>
                              n.id === notification.id ? { ...n, read: true } : n
                            )
                          );
                          setUnreadCount((prev) => Math.max(0, prev - 1));
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {notification.image ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
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
                                  ? "bg-orange-500"
                                  : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {notification.title}
                              </p>
                              {!notification.image && (
                                <div
                                  className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                                    !notification.read
                                      ? "bg-orange-500"
                                      : "bg-gray-300 dark:bg-gray-600"
                                  }`}
                                />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
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
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await fetch("/api/notifications", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              markAllAsRead: true,
                            }),
                          });
                        } catch (error) {
                          console.error("Failed to mark all notifications as read:", error);
                        }
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true }))
                        );
                        setUnreadCount(0);
                      }}
                      className="flex-1 text-sm text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium py-2 border-r border-gray-200 dark:border-gray-700"
                    >
                      {t("header.markAllAsRead")}
                    </button>
                    <button
                      onClick={deleteAllNotifications}
                      disabled={deletingAll}
                      className="flex-1 text-sm text-center text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        {/* Messages */}
        <div className="relative" ref={messagesRef}>
          <button
            onClick={() => setShowMessages(!showMessages)}
            className="relative w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Messages"
          >
            <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Messages Dropdown */}
          {showMessages && (
            <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t("header.messages")}
                  {unreadMessagesCount > 0 && (
                    <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                      ({unreadMessagesCount} {t("header.unread")})
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push("/admin/messages")}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    {t("common.viewAll")}
                  </button>
                  <button
                    onClick={() => setShowMessages(false)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                    aria-label="Close messages"
                  >
                    <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>

              {/* Messages List */}
              <div className="overflow-y-auto flex-1">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("header.noMessages")}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                          !message.readByAdmin ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                        onClick={async () => {
                          // Mark as read if unread
                          if (!message.readByAdmin) {
                            try {
                              await fetch(`/api/chat/${message.id}`, {
                                method: "PUT",
                              });
                              setMessages((prev) =>
                                prev.map((m) =>
                                  m.id === message.id ? { ...m, readByAdmin: true } : m
                                )
                              );
                              setUnreadMessagesCount((prev) => Math.max(0, prev - 1));
                            } catch (error) {
                              console.error("Failed to mark message as read:", error);
                            }
                          }
                          router.push("/admin/messages");
                          setShowMessages(false);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {message.user.name
                              ? message.user.name.charAt(0).toUpperCase()
                              : message.user.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {message.user.name || message.user.email}
                              </p>
                              {!message.readByAdmin && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {message.message}
                            </p>
                            {message.adminResponse && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                                {t("header.replied")}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {new Date(message.createdAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {messages.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      router.push("/admin/messages");
                      setShowMessages(false);
                    }}
                    className="w-full text-sm text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium py-2"
                  >
                    {t("common.viewAll")} {t("header.messages").toLowerCase()}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Full Screen */}
        <button 
          onClick={toggleFullscreen}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Maximize2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        {/* User Profile */}
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-3 ml-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden relative">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = session?.user?.email?.charAt(0).toUpperCase() || "U";
                  }
                }}
              />
            ) : (
              session?.user?.email?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {session?.user?.name || session?.user?.email?.split("@")[0] || "User"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Admin</div>
          </div>
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowAccountSettings(true)}
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label={t("header.accountSettings")}
        >
          <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Account Settings Menu */}
      <AccountSettingsMenu
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
      />
    </header>
  );
}
