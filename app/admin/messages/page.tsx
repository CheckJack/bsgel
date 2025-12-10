"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageCircle, Send, Check, CheckCheck, Loader2, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast, handleApiError } from "@/lib/utils";
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type FilterType = "all" | "unread" | "replied" | "not_replied";
type SortField = "createdAt" | "user" | "readByAdmin";
type SortDirection = "asc" | "desc";

export default function AdminMessagesPage() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState<string | null>(null);
  
  // Search, filter, sort, pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: entriesPerPage.toString(),
        sortField: sortField,
        sortDirection: sortDirection,
        filter: filter,
      });
      
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const res = await fetch(`/api/chat?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        setMessages(data.messages || []);
        setPagination(data.pagination || pagination);
        
        // Update selected message if it's still in the list
        setSelectedMessage((prev) => {
          if (!prev) return null;
          const updated = data.messages?.find((m: ChatMessage) => m.id === prev.id);
          if (updated) {
            // Pre-fill response textarea if there's an existing response and textarea is empty
            setResponseText((currentText) => {
              if (currentText === "" && updated.adminResponse) {
                return updated.adminResponse;
              }
              return currentText;
            });
            return updated;
          }
          return prev;
        });
      } else {
        throw { response: res, error: data.error };
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      handleApiError(error, "load messages");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, entriesPerPage, searchQuery, filter, sortField, sortDirection]);

  useEffect(() => {
    fetchMessages();
    // Refresh messages every 30 seconds
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleMarkAsRead = async (messageId: string) => {
    if (isMarkingRead) return;
    setIsMarkingRead(messageId);
    try {
      const res = await fetch(`/api/chat/${messageId}`, {
        method: "PUT",
      });
      if (res.ok) {
        const updated = await res.json();
        toast("Message marked as read", "success");
        await fetchMessages();
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(updated);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
      handleApiError(error, "mark message as read");
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
        // Keep the response text in the textarea after successful update
        toast(selectedMessage.adminResponse ? t("messages.responseUpdated") : t("messages.responseSent"), "success");
        await fetchMessages();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to respond:", error);
      handleApiError(error, "send response");
    } finally {
      setIsResponding(false);
    }
  };

  const handleSelectMessage = (message: ChatMessage) => {
    setSelectedMessage(message);
    // Pre-fill response textarea with existing response if available
    setResponseText(message.adminResponse || "");
    if (!message.readByAdmin) {
      handleMarkAsRead(message.id);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1 text-blue-600" />
      : <ArrowDown className="h-4 w-4 ml-1 text-blue-600" />;
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

  const unreadCount = pagination.total > 0 
    ? messages.filter((m) => !m.readByAdmin).length 
    : 0;

  const totalUnread = filter === "unread" ? pagination.total : unreadCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t("messages.title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {totalUnread > 0 && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {totalUnread} {totalUnread !== 1 ? t("messages.unreadMessagesPlural") : t("messages.unreadMessages")}
              </span>
            )}
            {totalUnread === 0 && pagination.total > 0 && t("messages.allMessagesRead")}
            {pagination.total === 0 && !isLoading && t("messages.noMessages")}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t("messages.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t("messages.allMessages")}</option>
              <option value="unread">{t("messages.unread")}</option>
              <option value="replied">{t("messages.replied")}</option>
              <option value="not_replied">{t("messages.notReplied")}</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort("createdAt")}
              className="flex items-center gap-1"
            >
              {t("messages.sortDate")} {getSortIcon("createdAt")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort("user")}
              className="flex items-center gap-1"
            >
              {t("messages.sortUser")} {getSortIcon("user")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort("readByAdmin")}
              className="flex items-center gap-1"
            >
              {t("messages.sortStatus")} {getSortIcon("readByAdmin")}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {t("messages.title")} ({pagination.total})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("messages.noMessages")}</p>
                {searchQuery && (
                  <p className="text-xs mt-2">{t("common.tryAdjustingSearch")}</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {messages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
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
                          {t("messages.replied")}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("table.page")} {pagination.page} {t("table.of")} {pagination.totalPages} ({pagination.total} {t("table.results")})
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Message Detail & Response */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
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
                          {t("messages.markAsRead")}
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>{t("messages.sent")}: {formatTime(selectedMessage.createdAt)}</span>
                  {selectedMessage.readAt && (
                    <span>{t("messages.read")}: {formatTime(selectedMessage.readAt)}</span>
                  )}
                  <span
                    className={`px-2 py-1 rounded ${
                      selectedMessage.readByAdmin
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                    }`}
                  >
                    {selectedMessage.readByAdmin ? t("messages.read") : t("messages.unread")}
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* User Message */}
                <div className="flex flex-col items-end">
                  <div className="max-w-[80%] rounded-lg bg-blue-600 text-white p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTime(selectedMessage.createdAt)}
                  </span>
                </div>

                {/* Admin Response */}
                {selectedMessage.adminResponse && (
                  <div className="flex flex-col items-start">
                    <div className="max-w-[80%] rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-4">
                      <p className="text-sm font-medium mb-1">{t("messages.adminResponse")}:</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedMessage.adminResponse}</p>
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
                        ? t("messages.updateResponse")
                        : t("messages.sendResponse")}
                    </label>
                    <Textarea
                      id="response"
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder={t("messages.typeResponse")}
                      rows={4}
                      className="w-full"
                      disabled={isResponding}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {responseText.length} characters
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={!responseText.trim() || isResponding}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    {isResponding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("common.loading")}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {selectedMessage.adminResponse
                          ? t("messages.updateResponse")
                          : t("messages.sendResponse")}
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
                <p>{t("messages.selectMessage")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
