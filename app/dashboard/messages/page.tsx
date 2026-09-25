"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";

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
  const { t } = useLanguage();
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
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-brand-black">
            {t("clientPanel.messages.title")}
          </h1>
          <p className="mt-1 text-sm text-brand-black/50">
            {unreadResponses > 0 && (
              <span className="font-medium text-brand-champagne">
                {t("clientPanel.messages.newResponses", { count: String(unreadResponses), plural: unreadResponses !== 1 ? "s" : "" })}
              </span>
            )}
            {unreadResponses === 0 && messagesArray.length > 0 && t("clientPanel.messages.allCaughtUp")}
            {messagesArray.length === 0 && t("clientPanel.messages.noMessagesYet")}
          </p>
        </div>
        <Button
          onClick={() => {
            setShowNewMessageForm(true);
            setSelectedMessage(null);
            setReplyText("");
          }}
          className="rounded-none bg-brand-black text-brand-white hover:bg-brand-black/90"
        >
          <Send className="mr-2 h-4 w-4" />
          {t("clientPanel.messages.newMessage")}
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-3 lg:h-[calc(100dvh-var(--site-header-height,113px)-11.5rem)] lg:max-h-[calc(100dvh-var(--site-header-height,113px)-11.5rem)] lg:overflow-hidden">
        {/* Messages List */}
        <div className="flex min-h-0 flex-col overflow-hidden border border-[#e8e4de] bg-white lg:col-span-1">
          <div className="shrink-0 border-b border-[#e8e4de] bg-[#faf9f7] px-4 py-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-brand-champagne">
              {t("clientPanel.messages.yourMessages", { count: String(messagesArray.length) })}
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {messagesArray.length === 0 ? (
              <div className="p-8 text-center text-brand-black/45">
                <MessageCircle className="mx-auto mb-4 h-10 w-10 opacity-40" />
                <p>{t("clientPanel.messages.noMessagesYet")}</p>
                <p className="mt-2 text-sm">{t("clientPanel.messages.startConversation")}</p>
              </div>
            ) : (
              <div className="divide-y divide-[#eee8e0]">
                {messagesArray.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message);
                      setShowNewMessageForm(false);
                      setReplyText("");
                    }}
                    className={`flex min-h-[100px] w-full flex-col p-4 text-left transition-colors hover:bg-[#faf9f7] ${
                      selectedMessage?.id === message.id
                        ? "border-l-2 border-brand-champagne bg-[#faf9f7]"
                        : ""
                    } ${message.adminResponse && !message.readByAdmin ? "bg-[#faf9f7]" : ""}`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-brand-black">
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                      {message.adminResponse ? (
                        <span className="flex-shrink-0 border border-brand-champagne/30 bg-white px-2 py-0.5 text-[10px] uppercase tracking-wider text-brand-champagne">
                          {t("clientPanel.messages.replied")}
                        </span>
                      ) : (
                        <span className="flex-shrink-0 border border-[#e8e4de] bg-white px-2 py-0.5 text-[10px] uppercase tracking-wider text-brand-black/45">
                          {t("clientPanel.messages.pending")}
                        </span>
                      )}
                    </div>
                    <p className="mb-2 line-clamp-2 flex-1 text-sm text-brand-black/70">
                      {message.message}
                    </p>
                    {message.adminResponse && (
                      <p className="line-clamp-1 text-xs italic text-brand-black/40">
                        {t("clientPanel.messages.adminResponse")}: {message.adminResponse}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail & Response */}
        <div className="flex min-h-[280px] flex-col overflow-hidden border border-[#e8e4de] bg-white lg:col-span-2 lg:min-h-0">
          {showNewMessageForm ? (
            <div className="flex flex-col h-full min-h-0">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t("clientPanel.messages.newMessageTitle")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t("clientPanel.messages.sendToSupport")}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSendNewMessage} className="space-y-4">
                  <div>
                    <label
                      htmlFor="newMessage"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {t("clientPanel.messages.yourMessage")}
                    </label>
                    <Textarea
                      id="newMessage"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder={t("clientPanel.messages.typeMessage")}
                      rows={8}
                      className="w-full"
                      disabled={isSending}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={!newMessageText.trim() || isSending}
                      className="bg-brand-black text-brand-white hover:bg-brand-black/90 flex items-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("clientPanel.messages.sending")}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          {t("clientPanel.messages.sendMessage")}
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
                      {t("clientPanel.messages.cancel")}
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
                      {t("clientPanel.messages.messageDetails")}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("clientPanel.messages.sent", { time: formatTime(selectedMessage.createdAt) })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewMessageForm(true);
                        setSelectedMessage(null);
                        setReplyText("");
                      }}
                      className="text-xs"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {t("clientPanel.messages.newMessage")}
                    </Button>
                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        selectedMessage.adminResponse
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      }`}
                    >
                      {selectedMessage.adminResponse ? t("clientPanel.messages.replied") : t("clientPanel.messages.awaitingResponse")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                {/* User Message */}
                <div className="flex flex-col items-end">
                  <div className="max-w-[80%] w-full rounded-lg bg-blue-600 text-white p-4 break-words">
                    <p className="text-sm font-medium mb-1">{t("clientPanel.messages.you")}</p>
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
                      <p className="text-sm font-medium mb-1">{t("clientPanel.messages.adminResponse")}:</p>
                      <p className="text-sm whitespace-pre-wrap break-words">{selectedMessage.adminResponse}</p>
                    </div>
                    {selectedMessage.readAt && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("clientPanel.messages.read", { time: formatTime(selectedMessage.readAt) })}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-start">
                    <div className="max-w-[80%] w-full rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        {t("clientPanel.messages.waitingForResponse")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Send New Message or Reply Form */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                {selectedMessage.adminResponse ? (
                  <form onSubmit={handleReply} className="space-y-4">
                    <div>
                      <label
                        htmlFor="reply"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        {t("clientPanel.messages.sendNewMessage")}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {t("clientPanel.messages.createNewTopic")}
                      </p>
                      <Textarea
                        id="reply"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t("clientPanel.messages.typeYourMessage")}
                        rows={4}
                        className="w-full"
                        disabled={isSending}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!replyText.trim() || isSending}
                      className="bg-brand-black text-brand-white hover:bg-brand-black/90 flex items-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("clientPanel.messages.sending")}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          {t("clientPanel.messages.sendMessage")}
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {t("clientPanel.messages.waitingForAdmin")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center text-brand-black/45">
              <div className="text-center">
                <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-40" />
                <p>{t("clientPanel.messages.selectMessage")}</p>
                <p className="mt-2 text-sm">{t("clientPanel.messages.orCreateNew")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

