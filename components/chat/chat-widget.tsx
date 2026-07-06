"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { hasStoredConsent } from "@/lib/cookie-consent";
import { HOME_ENTRY_LOADER_COMPLETE_EVENT } from "@/lib/home-entry-loader";

interface ChatMessage {
  id: string;
  message: string;
  adminResponse?: string | null;
  createdAt: string;
  readByAdmin: boolean;
  readAt?: string | null;
  user: {
    name: string | null;
    email: string;
  };
}

export function ChatWidget() {
  const { data: session, status } = useSession();
  const { t, language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cookieBannerOpen, setCookieBannerOpen] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get viewed message IDs from localStorage
  const getViewedMessageIds = useCallback(() => {
    if (typeof window === 'undefined' || !session?.user?.id) return new Set<string>();
    const key = `chat_viewed_ids_${session.user.id}`;
    const stored = localStorage.getItem(key);
    return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
  }, [session?.user?.id]);
  
  // Mark messages as viewed by storing their IDs
  const markMessagesAsViewed = useCallback((messageIds: string[]) => {
    if (typeof window === 'undefined' || !session?.user?.id || messageIds.length === 0) return;
    const key = `chat_viewed_ids_${session.user.id}`;
    const viewed = getViewedMessageIds();
    messageIds.forEach(id => viewed.add(id));
    localStorage.setItem(key, JSON.stringify(Array.from(viewed)));
  }, [session?.user?.id, getViewedMessageIds]);

  // Check if we should hide the widget on admin pages or if user is an admin
  const isAdmin = session?.user?.role === "ADMIN";
  const shouldHide =
    pathname?.startsWith("/admin") || pathname === "/salons" || isAdmin || false;
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const liftAboveAuth = isAuthPage && isMobile;

  const fetchMessages = useCallback(async () => {
    if (!session) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        // Handle both paginated and non-paginated responses
        const messagesList = Array.isArray(data) ? data : (data.messages || []);
        setMessages(messagesList);
        
        // Don't update unread count when chat is open (user is viewing messages)
        // Unread count is only updated when chat is closed via fetchUnreadCount
      } else {
        const errorData = await res.json().catch(() => ({ error: null }));
        const errorMessage = errorData.error || t("chat.fetchFailedWithStatus", { status: String(res.status) });
        setError(errorMessage);
        console.error("Failed to fetch messages:", errorMessage, res.status);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("chat.fetchFailed");
      setError(errorMessage);
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session, t]);

  // Fetch unread count periodically when widget is closed and user is logged in
  const fetchUnreadCount = useCallback(async () => {
    // NEVER fetch unread count if chat is open - user is viewing messages
    if (!session || isOpen || shouldHide) return;
    
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        const messagesList = Array.isArray(data) ? data : (data.messages || []);
        const viewedIds = getViewedMessageIds();
        
        // Only count messages with admin responses that haven't been viewed
        const unread = messagesList.filter((msg: ChatMessage) => {
          return msg.adminResponse && !viewedIds.has(msg.id);
        }).length;
        
        setUnreadCount(unread);
      }
    } catch (error) {
      // Silently fail for unread count fetch
      console.error("Failed to fetch unread count:", error);
    }
  }, [session, isOpen, shouldHide, getViewedMessageIds]);

  useEffect(() => {
    if (isOpen && session && !shouldHide) {
      fetchMessages();
    }
  }, [isOpen, session, shouldHide, fetchMessages]);
  
  // Mark all messages as viewed when they are loaded and chat is open
  useEffect(() => {
    if (isOpen && messages.length > 0 && !shouldHide) {
      const messageIds = messages.map(msg => msg.id);
      markMessagesAsViewed(messageIds);
      // Clear unread count since user is viewing messages
      setUnreadCount(0);
    }
  }, [isOpen, messages, shouldHide, markMessagesAsViewed]);

  useEffect(() => {
    if (isOpen && !shouldHide) {
      // Auto-scroll to bottom when messages change
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, shouldHide]);

  // Clear unread count when chat is opened and keep it at 0 while open
  useEffect(() => {
    if (isOpen && !shouldHide) {
      // Clear immediately when chat opens
      setUnreadCount(0);
    }
  }, [isOpen, shouldHide]);
  
  // Ensure unread count stays at 0 while chat is open (prevent any recalculation)
  useEffect(() => {
    if (isOpen && !shouldHide && unreadCount > 0) {
      setUnreadCount(0);
    }
  }, [isOpen, shouldHide, unreadCount]);

  // Fetch unread count periodically when widget is closed
  useEffect(() => {
    if (session && !isOpen && !shouldHide) {
      // Fetch immediately
      fetchUnreadCount();
      // Then fetch every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session, isOpen, shouldHide, fetchUnreadCount]);

  useEffect(() => {
    const syncCookieBannerState = () => {
      setCookieBannerOpen(document.body.hasAttribute("data-cookie-banner-open"));
      setConsentGiven(hasStoredConsent());
    };

    syncCookieBannerState();

    const observer = new MutationObserver(syncCookieBannerState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-cookie-banner-open"],
    });

    const onConsent = () => {
      setConsentGiven(true);
      setCookieBannerOpen(false);
    };

    window.addEventListener(HOME_ENTRY_LOADER_COMPLETE_EVENT, syncCookieBannerState);
    window.addEventListener("cookieConsentChanged", onConsent);

    return () => {
      observer.disconnect();
      window.removeEventListener(HOME_ENTRY_LOADER_COMPLETE_EVENT, syncCookieBannerState);
      window.removeEventListener("cookieConsentChanged", onConsent);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const handleOpen = () => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    // Clear unread count immediately when opening
    setUnreadCount(0);
    setIsOpen(true);
  };
  
  const handleClose = () => {
    setIsOpen(false);
    // After closing, fetch unread count to see if there are new messages
    if (session && !shouldHide) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        fetchUnreadCount();
      }, 100);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session || isSending) return;

    setIsSending(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewMessage("");
        // Refresh messages to get updated list (includes the new message)
        await fetchMessages();
      } else {
        // Handle error response
        const errorData = await res.json().catch(() => ({ error: null }));
        const errorMessage = errorData.error || t("chat.sendFailedWithStatus", { status: String(res.status) });
        setError(errorMessage);
        console.error("Failed to send message:", errorMessage, res.status);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("chat.sendFailed");
      setError(errorMessage);
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const locale = language === "pt" ? "pt-PT" : "en-US";

    if (minutes < 1) return t("chat.justNow");
    if (minutes < 60) return t("chat.minutesAgo", { minutes: String(minutes) });
    if (hours < 24) return t("chat.hoursAgo", { hours: String(hours) });
    if (days < 7) return t("chat.daysAgo", { days: String(days) });
    return date.toLocaleDateString(locale);
  };

  // Don't render anything on admin pages or while cookie consent is pending
  if (shouldHide || cookieBannerOpen || !consentGiven) {
    return null;
  }

  const widget = (
    <>
      {/* Floating Button */}
      {!isOpen && (
      <button
        onClick={handleOpen}
        data-chat-widget="trigger"
        className={`fixed bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#857D71] text-white shadow-lg transition-all hover:bg-[#6d685f] hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#857D71] focus:ring-offset-2 sm:bottom-6 sm:right-6 ${liftAboveAuth ? "z-[10050]" : "z-[9999]"}`}
        aria-label={t("chat.open")}
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div data-chat-widget="panel" className={`fixed bottom-0 right-0 flex h-[min(100dvh,520px)] w-screen flex-col bg-white shadow-2xl dark:bg-gray-800 sm:bottom-6 sm:right-6 sm:h-[480px] sm:w-[400px] sm:rounded-lg ${liftAboveAuth ? "z-[10050]" : "z-[9999]"}`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-[#857D71] text-white p-3 sm:p-4 rounded-t-lg sm:rounded-t-lg">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-semibold text-sm sm:text-base">{t("chat.title")}</h3>
              <p className="text-xs text-gray-300 hidden sm:block">{t("chat.subtitle")}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-[#6d685f] rounded transition-colors flex-shrink-0"
              aria-label={t("chat.close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 px-4">
                <p className="text-center text-sm sm:text-base">
                  {t("chat.emptyLine1")} <br />
                  {t("chat.emptyStart")}
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  {/* User Message */}
                  <div className="flex flex-col items-end">
                    <div className="max-w-[85%] sm:max-w-[80%] rounded-lg bg-blue-600 text-white p-2.5 sm:p-3">
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{formatTime(msg.createdAt)}</span>
                      {msg.readByAdmin && (
                        <span className="text-green-500">{t("chat.read")}</span>
                      )}
                    </div>
                  </div>

                  {/* Admin Response */}
                  {msg.adminResponse && (
                    <div className="flex flex-col items-start">
                      <div className="max-w-[85%] sm:max-w-[80%] rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2.5 sm:p-3">
                        <p className="text-sm break-words">{msg.adminResponse}</p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("chat.admin")}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-white dark:bg-gray-800">
            {error && (
              <div className="mb-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  setError(null); // Clear error when user types
                }}
                placeholder={t("chat.placeholder")}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 sm:px-4 py-2 text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="bg-[#857D71] hover:bg-[#6d685f] text-white px-3 sm:px-4 h-[38px] sm:h-auto flex-shrink-0"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );

  if (liftAboveAuth && typeof document !== "undefined") {
    return createPortal(widget, document.body);
  }

  return widget;
}

