"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function CustomerMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      fetchMessages();
      // Refresh messages every 30 seconds
      const interval = setInterval(fetchMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [session, status, router]);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        // Handle both paginated and non-paginated responses
        const messagesList = Array.isArray(data) ? data : (data.messages || []);
        setMessages(messagesList);
        // Update selected message if it's still in the list
        if (selectedMessage) {
          const updated = messagesList.find((m: ChatMessage) => m.id === selectedMessage.id);
          if (updated) setSelectedMessage(updated);
        }
      } else {
        const error = await res.json();
        console.error("Failed to fetch messages:", error);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessageText }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages([newMessage, ...(Array.isArray(messages) ? messages : [])]);
        setSelectedMessage(newMessage);
        setNewMessageText("");
        setShowNewMessageForm(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage || isSending) return;

    setIsSending(true);
    try {
      // Create a new message as a reply
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: `Re: ${selectedMessage.message.substring(0, 50)}...\n\n${replyText}` 
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages([newMessage, ...(Array.isArray(messages) ? messages : [])]);
        setSelectedMessage(newMessage);
        setReplyText("");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to send reply. Please try again.");
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
      alert("Failed to send reply. Please try again.");
    } finally {
      setIsSending(false);
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

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Ensure messages is always an array
  const messagesArray = Array.isArray(messages) ? messages : [];
  
  // For clients: count messages with admin responses (since there's no client read tracking yet)
  const unreadResponses = messagesArray.filter((m) => m.adminResponse).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Messages
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {unreadResponses > 0 && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {unreadResponses} new response{unreadResponses !== 1 ? "s" : ""}
              </span>
            )}
            {unreadResponses === 0 && messagesArray.length > 0 && "All caught up"}
            {messagesArray.length === 0 && "No messages yet"}
          </p>
        </div>
        <Button
          onClick={() => {
            setShowNewMessageForm(true);
            setSelectedMessage(null);
            setReplyText("");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Send className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Your Messages ({messagesArray.length})
            </h2>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {messagesArray.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm mt-2">Start a conversation with our team</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {messagesArray.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message);
                      setShowNewMessageForm(false);
                      setReplyText("");
                    }}
                    className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[100px] flex flex-col ${
                      selectedMessage?.id === message.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600"
                        : ""
                    } ${message.adminResponse && !message.readByAdmin ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                      {message.adminResponse ? (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded flex-shrink-0">
                          Replied
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded flex-shrink-0">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2 flex-1">
                      {message.message}
                    </p>
                    {message.adminResponse && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-1">
                        Admin: {message.adminResponse}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail & Response */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[600px]">
          {showNewMessageForm ? (
            <div className="flex flex-col h-full min-h-0">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  New Message
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Send a message to our support team
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSendNewMessage} className="space-y-4">
                  <div>
                    <label
                      htmlFor="newMessage"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Your Message
                    </label>
                    <Textarea
                      id="newMessage"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="Type your message here..."
                      rows={8}
                      className="w-full"
                      disabled={isSending}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={!newMessageText.trim() || isSending}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewMessageForm(false);
                        setNewMessageText("");
                      }}
                      disabled={isSending}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : selectedMessage ? (
            <div className="flex flex-col h-full min-h-0">
              {/* Message Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Message Details
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sent: {formatTime(selectedMessage.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      selectedMessage.adminResponse
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                    }`}
                  >
                    {selectedMessage.adminResponse ? "Replied" : "Awaiting Response"}
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                {/* User Message */}
                <div className="flex flex-col items-end">
                  <div className="max-w-[80%] w-full rounded-lg bg-blue-600 text-white p-4 break-words">
                    <p className="text-sm font-medium mb-1">You:</p>
                    <p className="text-sm whitespace-pre-wrap break-words">{selectedMessage.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTime(selectedMessage.createdAt)}
                  </span>
                </div>

                {/* Admin Response */}
                {selectedMessage.adminResponse ? (
                  <div className="flex flex-col items-start">
                    <div className="max-w-[80%] w-full rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-4 break-words">
                      <p className="text-sm font-medium mb-1">Admin Response:</p>
                      <p className="text-sm whitespace-pre-wrap break-words">{selectedMessage.adminResponse}</p>
                    </div>
                    {selectedMessage.readAt && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Read: {formatTime(selectedMessage.readAt)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-start">
                    <div className="max-w-[80%] w-full rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Waiting for admin response...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              {selectedMessage.adminResponse && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <form onSubmit={handleReply} className="space-y-4">
                    <div>
                      <label
                        htmlFor="reply"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Reply to Admin
                      </label>
                      <Textarea
                        id="reply"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={4}
                        className="w-full"
                        disabled={isSending}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!replyText.trim() || isSending}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[600px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a message to view details</p>
                <p className="text-sm mt-2">or create a new message</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

