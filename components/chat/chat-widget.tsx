"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if we should hide the widget on admin pages
  const shouldHide = pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard");

  const fetchMessages = useCallback(async () => {
    if (!session) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else {
        const errorData = await res.json().catch(() => ({ error: "Failed to fetch messages" }));
        const errorMessage = errorData.error || `Failed to fetch messages (${res.status})`;
        setError(errorMessage);
        console.error("Failed to fetch messages:", errorMessage, res.status);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch messages. Please try again.";
      setError(errorMessage);
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (isOpen && session && !shouldHide) {
      fetchMessages();
    }
  }, [isOpen, session, shouldHide, fetchMessages]);

  useEffect(() => {
    if (isOpen && !shouldHide) {
      // Auto-scroll to bottom when messages change
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, shouldHide]);

  const handleOpen = () => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    setIsOpen(true);
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
        const errorData = await res.json().catch(() => ({ error: "Failed to send message" }));
        const errorMessage = errorData.error || `Failed to send message (${res.status})`;
        setError(errorMessage);
        console.error("Failed to send message:", errorMessage, res.status);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message. Please try again.";
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

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Don't render anything on admin pages
  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black text-white shadow-lg transition-all hover:bg-gray-900 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        aria-label="Open chat"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 flex h-screen w-screen sm:h-[600px] sm:w-[400px] sm:rounded-lg flex-col bg-white shadow-2xl dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-black text-white p-3 sm:p-4 rounded-t-lg sm:rounded-t-lg">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-semibold text-sm sm:text-base">Chat with us</h3>
              <p className="text-xs text-gray-300 hidden sm:block">We&apos;ll respond as soon as possible</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-900 rounded transition-colors flex-shrink-0"
              aria-label="Close chat"
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
                  No messages yet. <br />
                  Start a conversation!
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
                        <span className="text-green-500">✓ Read</span>
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
                        Admin
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
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 sm:px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="bg-black hover:bg-gray-900 text-white px-3 sm:px-4 h-[38px] sm:h-auto flex-shrink-0"
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
}

