"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bot,
  X,
  Send,
  Loader2,
  Paperclip,
  RotateCcw,
  History,
  GripVertical,
  Search,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { isAdminAiEnabledClient } from "@/lib/admin-ai/config";
import { getNoReply, getYesReply, isYesNoPrompt } from "@/lib/admin-ai/yes-no-prompt";
import { AdminAiMessageBubble, type AdminAiMessageData } from "@/components/admin/admin-ai/admin-ai-message-bubble";
import { AdminAiQuickActions } from "@/components/admin/admin-ai/admin-ai-quick-actions";
import type { AdminAiAttachment, AdminAiRichPreview, AdminAiActionLink } from "@/lib/admin-ai/types";

const STORAGE_KEY = "admin_ai_conversation_id";
const MIN_WIDTH = 320;
const MAX_WIDTH = 640;
const DEFAULT_WIDTH = 480;

export function AdminAiWidget() {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [messages, setMessages] = useState<AdminAiMessageData[]>([]);
  const [conversations, setConversations] = useState<{ id: string; title: string | null; updatedAt: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<AdminAiAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const effectiveWidth = useMemo(
    () => Math.min(panelWidth, typeof window !== "undefined" ? window.innerWidth - 48 : panelWidth),
    [panelWidth]
  );

  const filteredConversations = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => (c.title || "").toLowerCase().includes(q));
  }, [conversations, historySearch]);

  useEffect(() => {
    if (!isAdminAiEnabledClient()) return;
    fetch("/api/admin/ai/status")
      .then((r) => r.json())
      .then((d) => setEnabled(!!d.enabled))
      .catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, steps]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((o) => !o);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const panel = panelRef.current;
    if (!panel) return;

    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || focusable.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    panel.addEventListener("keydown", trap);
    return () => panel.removeEventListener("keydown", trap);
  }, [isOpen, showHistory, messages.length]);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const w = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - e.clientX - 24));
      setPanelWidth(w);
    };
    const onUp = () => setResizing(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizing]);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/admin/ai/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations || []);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/ai/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setConversationId(data.id);
    localStorage.setItem(STORAGE_KEY, data.id);
    setMessages(data.messages || []);
    setShowHistory(false);
    setHistorySearch("");
  }, []);

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await fetch(`/api/admin/ai/conversations/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (conversationId === id) {
      setConversationId(null);
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  useEffect(() => {
    if (!isOpen || !enabled) return;
    loadConversations();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && messages.length === 0) {
      loadConversation(stored).catch(() => localStorage.removeItem(STORAGE_KEY));
    }
  }, [isOpen, enabled, loadConversations, loadConversation, messages.length]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: text.trim() }]);
      setInput("");
      setIsLoading(true);
      setSteps([]);

      const streamMsgId = `a-${Date.now()}`;

      try {
        const res = await fetch("/api/admin/ai/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            message: text.trim(),
            pageContext: pathname,
            attachmentContext: attachment?.extractedText || undefined,
            imageAttachment:
              attachment?.imageBase64 && attachment.mimeType
                ? { mimeType: attachment.mimeType, base64: attachment.imageBase64 }
                : undefined,
          }),
        });

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalMessage = "";
        let streamedText = "";
        const pendingPayloads: NonNullable<AdminAiMessageData["pendingActions"]> = [];
        let newConversationId = conversationId;
        let streamStarted = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const lines = part.split("\n");
            const event = lines.find((l) => l.startsWith("event: "))?.slice(7);
            const dataLine = lines.find((l) => l.startsWith("data: "))?.slice(6);
            if (!event || !dataLine) continue;
            const data = JSON.parse(dataLine);
            if (event === "step") setSteps((s) => [...s, data.text]);
            if (event === "token") {
              streamedText += data.text;
              if (!streamStarted) {
                streamStarted = true;
                setMessages((prev) => [
                  ...prev,
                  { id: streamMsgId, role: "assistant", content: streamedText, streaming: true },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamMsgId ? { ...m, content: streamedText } : m
                  )
                );
              }
            }
            if (event === "message") finalMessage = data.text;
            if (event === "pending") {
              pendingPayloads.push({
                id: data.id,
                preview: data.preview,
                richPreview: data.richPreview as AdminAiRichPreview,
                toolName: data.toolName,
                links: data.links as AdminAiActionLink[],
                expiresAt: data.expiresAt,
              });
            }
            if (event === "done") newConversationId = data.conversationId;
            if (event === "error") throw new Error(data.message);
          }
        }

        if (newConversationId) {
          setConversationId(newConversationId);
          localStorage.setItem(STORAGE_KEY, newConversationId);
        }

        const assistantMessage: AdminAiMessageData = {
          id: streamMsgId,
          role: "assistant",
          content: finalMessage || streamedText || t("adminAi.errorGeneric"),
          pendingActions: pendingPayloads.length ? pendingPayloads : undefined,
          pendingAction: pendingPayloads[0],
          streaming: false,
        };

        setMessages((prev) => {
          const hasStream = prev.some((m) => m.id === streamMsgId);
          if (hasStream) {
            return prev.map((m) => (m.id === streamMsgId ? assistantMessage : m));
          }
          return [...prev, assistantMessage];
        });

        setAttachment(null);
        loadConversations();
      } catch (e) {
        setMessages((prev) => {
          const withoutStream = prev.filter((m) => m.id !== streamMsgId || !m.streaming);
          return [
            ...withoutStream,
            { id: `e-${Date.now()}`, role: "assistant", content: e instanceof Error ? e.message : t("adminAi.errorGeneric"), variant: "error" },
          ];
        });
      } finally {
        setIsLoading(false);
        setSteps([]);
      }
    },
    [attachment, conversationId, isLoading, loadConversations, pathname, t]
  );

  const handleConfirm = async (pendingActionId: string) => {
    setConfirmingId(pendingActionId);
    try {
      const res = await fetch("/api/admin/ai/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingActionId, action: "confirm" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages((prev) =>
        prev.map((m) => {
          const pendingList = m.pendingActions?.length
            ? m.pendingActions
            : m.pendingAction
              ? [m.pendingAction]
              : [];
          if (!pendingList.some((p) => p.id === pendingActionId)) return m;

          const remaining = pendingList.filter((p) => p.id !== pendingActionId);
          if (remaining.length > 0) {
            return {
              ...m,
              pendingActions: remaining,
              pendingAction: remaining[0],
              confirmingId: null,
            };
          }

          return {
            ...m,
            pendingActions: undefined,
            pendingAction: undefined,
            content: t("adminAi.applied"),
            variant: "success",
            undo: data.undo,
            links: data.links,
            successRichPreview: data.richPreview,
          };
        })
      );
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: e instanceof Error ? e.message : t("adminAi.confirmFailed"), variant: "error" },
      ]);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCancel = async (pendingActionId: string) => {
    setConfirmingId(pendingActionId);
    try {
      await fetch("/api/admin/ai/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingActionId, action: "cancel" }),
      });
      setMessages((prev) =>
        prev.map((m) => {
          const pendingList = m.pendingActions?.length
            ? m.pendingActions
            : m.pendingAction
              ? [m.pendingAction]
              : [];
          if (!pendingList.some((p) => p.id === pendingActionId)) return m;

          const remaining = pendingList.filter((p) => p.id !== pendingActionId);
          if (remaining.length > 0) {
            return { ...m, pendingActions: remaining, pendingAction: remaining[0] };
          }
          return { ...m, pendingActions: undefined, pendingAction: undefined, content: t("adminAi.cancelled"), variant: "system" };
        })
      );
    } finally {
      setConfirmingId(null);
    }
  };

  const handleUndo = async (undoId: string) => {
    setUndoingId(undoId);
    try {
      const res = await fetch("/api/admin/ai/undo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ undoId }) });
      const data = await res.json();
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "assistant", content: data.success ? data.message : data.error, variant: data.success ? "success" : "error" }]);
    } catch {
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: "assistant", content: t("adminAi.undoFailed"), variant: "error" }]);
    } finally {
      setUndoingId(null);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/ai/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.extractedText) {
        setAttachment({ fileName: data.fileName, mimeType: data.mimeType, size: data.size, kind: "pdf", extractedText: data.extractedText });
      } else if (data.imageBase64) {
        setAttachment({ fileName: data.fileName, mimeType: data.mimeType, size: data.size, kind: "image", imageBase64: data.imageBase64 });
      }
    } catch (e) {
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: "assistant", content: e instanceof Error ? e.message : t("adminAi.errorGeneric"), variant: "error" }]);
    } finally {
      setUploading(false);
    }
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setAttachment(null);
    setHistorySearch("");
    localStorage.removeItem(STORAGE_KEY);
  };

  const runPdfWizard = () => {
    if (!attachment?.extractedText) return;
    sendMessage(
      "Analyze this supplier order PDF. Match each product to our catalog, show current stock + incoming quantity, and propose add_incoming_stock updates. Present a confirmation table before applying."
    );
  };

  if (!enabled) return null;

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-full bg-[#857D71] pl-4 pr-5 py-3 text-white shadow-lg transition hover:bg-[#6b6358]"
          aria-label={t("adminAi.open")}
        >
          <Bot className="h-5 w-5" />
          <span className="text-sm font-medium">{t("adminAi.title")}</span>
        </button>
      )}

      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("adminAi.title")}
          style={{ width: effectiveWidth, maxWidth: "min(480px, calc(100vw - 3rem))" }}
          className="fixed bottom-6 right-6 z-[60] flex h-[min(680px,85vh)] flex-col overflow-hidden rounded-2xl border border-[#857D71]/20 bg-white shadow-2xl dark:bg-gray-900"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize" onMouseDown={() => setResizing(true)}>
            <GripVertical className="mx-auto mt-[50%] h-4 w-4 text-gray-300" />
          </div>

          <div className="flex items-center justify-between border-b border-[#857D71]/15 bg-[#857D71]/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-[#857D71]" />
              <span className="font-semibold text-sm">{t("adminAi.title")}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setShowHistory((h) => !h)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100" title={t("adminAi.history")} aria-label={t("adminAi.history")}>
                <History className="h-4 w-4" />
              </button>
              <button type="button" onClick={startNewChat} className="rounded p-1.5 text-gray-500 hover:bg-gray-100" title={t("adminAi.newChat")} aria-label={t("adminAi.newChat")}>
                <RotateCcw className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100" aria-label={t("adminAi.close")}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showHistory && (
            <div className="max-h-40 overflow-y-auto border-b bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
              <p className="mb-1 text-[10px] font-semibold uppercase text-gray-400">{t("adminAi.loadHistory")}</p>
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder={t("adminAi.searchHistory")}
                  className="w-full rounded border border-gray-200 bg-white py-1 pl-7 pr-2 text-xs outline-none focus:border-[#857D71] dark:border-gray-600 dark:bg-gray-900"
                />
              </div>
              {filteredConversations.length === 0 ? (
                <p className="text-xs text-gray-500">{t("adminAi.noHistory")}</p>
              ) : (
                filteredConversations.map((c) => (
                  <div key={c.id} className="group flex items-center gap-1">
                    <button type="button" onClick={() => loadConversation(c.id)} className="block min-w-0 flex-1 truncate rounded px-2 py-1.5 text-left text-xs hover:bg-white dark:hover:bg-gray-700">
                      {c.title || t("adminAi.resumeChat")} · {new Date(c.updatedAt).toLocaleDateString()}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => deleteConversation(c.id, e)}
                      className="rounded p-1 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      aria-label={t("adminAi.deleteChat")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 && (
              <div className="text-sm text-gray-500 space-y-3">
                <p>{t("adminAi.emptyHint1")}</p>
                <AdminAiQuickActions onSelect={sendMessage} />
              </div>
            )}
            {messages.map((msg, index) => {
              const isLastMessage = index === messages.length - 1;
              const hasPending = !!(msg.pendingActions?.length || msg.pendingAction);
              const showYesNo =
                !isLoading &&
                isLastMessage &&
                msg.role === "assistant" &&
                !hasPending &&
                msg.variant !== "error" &&
                isYesNoPrompt(msg.content);

              return (
                <AdminAiMessageBubble
                  key={msg.id}
                  message={{ ...msg, confirmingId }}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  onUndo={handleUndo}
                  undoing={undoingId === msg.undo?.id}
                  showYesNo={showYesNo}
                  yesNoDisabled={isLoading}
                  onYesNo={(answer) => {
                    const lang = language === "pt" ? "pt" : "en";
                    sendMessage(answer === "yes" ? getYesReply(lang) : getNoReply(lang));
                  }}
                />
              );
            })}
            {isLoading && !messages.some((m) => m.streaming) && (
              <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 font-medium"><Loader2 className="h-3.5 w-3.5 animate-spin" />{t("adminAi.steps")}</div>
                {steps.map((s, i) => <p key={i} className="pl-5 text-gray-500">{s}</p>)}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t px-3 py-2.5">
            {attachment && (
              <div className="mb-2 rounded-md bg-[#857D71]/10 px-2 py-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">📎 {attachment.fileName}</span>
                  <button type="button" onClick={() => setAttachment(null)} className="shrink-0 text-gray-600 hover:text-gray-900">
                    {t("adminAi.removeAttachment")}
                  </button>
                </div>
                {attachment.extractedText && (
                  <div className="mt-2 space-y-1 border-t border-[#857D71]/20 pt-2">
                    <p className="font-medium text-[#6b6358]">{t("adminAi.pdfWizardTitle")}</p>
                    <p className="text-gray-600">{t("adminAi.pdfWizardStep1")}</p>
                    <p className="text-gray-600">{t("adminAi.pdfWizardStep2")}</p>
                    <button type="button" onClick={runPdfWizard} className="mt-1 font-medium text-[#857D71] hover:underline">
                      {t("adminAi.pdfWizardAnalyze")}
                    </button>
                  </div>
                )}
              </div>
            )}
            <input id="admin-ai-file" type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-1.5 py-1 dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => (document.getElementById("admin-ai-file") as HTMLInputElement)?.click()}
                disabled={uploading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={t("adminAi.attach")}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder={t("adminAi.placeholder")}
                rows={1}
                className="max-h-24 min-h-[36px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm outline-none focus:outline-none focus:ring-0"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#857D71] text-white transition hover:bg-[#6b6358] disabled:opacity-40"
                aria-label={t("adminAi.send")}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
