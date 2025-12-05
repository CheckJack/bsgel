"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send, Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
    // Refresh messages every 30 seconds
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        // Update selected message if it's still in the list
        if (selectedMessage) {
          const updated = data.find((m: ChatMessage) => m.id === selectedMessage.id);
          if (updated) setSelectedMessage(updated);
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    if (isMarkingRead) return;
    setIsMarkingRead(messageId);
    try {
      const res = await fetch(`/api/chat/${messageId}`, {
        method: "PUT",
      });
      if (res.ok) {
        await fetchMessages();
        if (selectedMessage?.id === messageId) {
          const updated = await res.json();
          setSelectedMessage(updated);
        }
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    } finally {
      setIsMarkingRead(null);
    }
  };

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !responseText.trim() || isResponding) return;

    setIsResponding(true);
    try {
      const res = await fetch(`/api/chat/${selectedMessage.id}/respond`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminResponse: responseText }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedMessage(updated);
        setResponseText("");
        await fetchMessages();
      }
    } catch (error) {
      console.error("Failed to respond:", error);
    } finally {
      setIsResponding(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = messages.filter((m) => !m.readByAdmin).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Messages
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {unreadCount > 0 && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
              </span>
            )}
            {unreadCount === 0 && "All messages read"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              All Messages ({messages.length})
            </h2>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {messages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message);
                      setResponseText("");
                      if (!message.readByAdmin) {
                        handleMarkAsRead(message.id);
                      }
                    }}
                    className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedMessage?.id === message.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600"
                        : ""
                    } ${!message.readByAdmin ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {message.user.name || message.user.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {message.user.email}
                        </p>
                      </div>
                      {message.readByAdmin ? (
                        <CheckCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Check className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                      {message.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(message.createdAt)}
                      </span>
                      {message.adminResponse && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                          Replied
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail & Response */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              {/* Message Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {selectedMessage.user.name || selectedMessage.user.email}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedMessage.user.email}
                    </p>
                  </div>
                  {!selectedMessage.readByAdmin && (
                    <Button
                      onClick={() => handleMarkAsRead(selectedMessage.id)}
                      disabled={isMarkingRead === selectedMessage.id}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {isMarkingRead === selectedMessage.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCheck className="h-4 w-4" />
                          Mark as Read
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>Sent: {formatTime(selectedMessage.createdAt)}</span>
                  {selectedMessage.readAt && (
                    <span>Read: {formatTime(selectedMessage.readAt)}</span>
                  )}
                  <span
                    className={`px-2 py-1 rounded ${
                      selectedMessage.readByAdmin
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                    }`}
                  >
                    {selectedMessage.readByAdmin ? "Read" : "Unread"}
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* User Message */}
                <div className="flex flex-col items-end">
                  <div className="max-w-[80%] rounded-lg bg-blue-600 text-white p-4">
                    <p className="text-sm">{selectedMessage.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTime(selectedMessage.createdAt)}
                  </span>
                </div>

                {/* Admin Response */}
                {selectedMessage.adminResponse && (
                  <div className="flex flex-col items-start">
                    <div className="max-w-[80%] rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-4">
                      <p className="text-sm font-medium mb-1">Admin Response:</p>
                      <p className="text-sm">{selectedMessage.adminResponse}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Response Form */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <form onSubmit={handleRespond} className="space-y-4">
                  <div>
                    <label
                      htmlFor="response"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {selectedMessage.adminResponse
                        ? "Update Response"
                        : "Send Response"}
                    </label>
                    <Textarea
                      id="response"
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Type your response..."
                      rows={4}
                      className="w-full"
                      disabled={isResponding}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!responseText.trim() || isResponding}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    {isResponding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {selectedMessage.adminResponse
                          ? "Update Response"
                          : "Send Response"}
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[600px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a message to view details and respond</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

