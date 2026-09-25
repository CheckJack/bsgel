"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Volume2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { AdminAiMarkdown } from "@/components/admin/admin-ai/admin-ai-markdown";
import { AdminAiConfirmCard } from "@/components/admin/admin-ai/admin-ai-confirm-card";
import {
  copyTextToClipboard,
  ensureSpeechVoicesLoaded,
  messageToPlainText,
  speakMessage,
  stopSpeaking,
} from "@/lib/admin-ai/message-actions";
import { stripYesNoMarker } from "@/lib/admin-ai/yes-no-prompt";
import { AdminAiYesNoButtons } from "@/components/admin/admin-ai/admin-ai-yes-no-buttons";
import { AdminAiSuccessCard, buildSuccessCardProps } from "@/components/admin/admin-ai/admin-ai-success-card";
import type { AdminAiRichPreview, AdminAiActionLink } from "@/lib/admin-ai/types";

export type AdminAiPendingActionData = {
  id: string;
  preview: string;
  richPreview?: AdminAiRichPreview;
  toolName: string;
  links?: AdminAiActionLink[];
  expiresAt?: string;
};

export type AdminAiMessageData = {
  id: string;
  role: "user" | "assistant";
  content: string;
  variant?: "assistant" | "error" | "success" | "system";
  createdAt?: string;
  pendingActions?: AdminAiPendingActionData[];
  /** @deprecated Use pendingActions */
  pendingAction?: AdminAiPendingActionData;
  undo?: {
    id: string;
    description: string;
    expiresAt: string;
  };
  links?: AdminAiActionLink[];
  confirming?: boolean;
  confirmingId?: string | null;
  successRichPreview?: AdminAiRichPreview;
  streaming?: boolean;
};

function MessageActions({
  messageId,
  content,
  isUser,
  canListen,
}: {
  messageId: string;
  content: string;
  isUser: boolean;
  canListen: boolean;
}) {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);

  useEffect(() => {
    if (!canListen) return;
    ensureSpeechVoicesLoaded().then(() => setSpeechReady(true));
    return () => {
      if (speaking) stopSpeaking();
    };
  }, [canListen, speaking]);

  const plainText = messageToPlainText(content);

  const handleCopy = useCallback(async () => {
    const ok = await copyTextToClipboard(plainText || content);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }, [plainText, content]);

  const handleListen = useCallback(async () => {
    if (!canListen || !speechReady) return;
    await ensureSpeechVoicesLoaded();
    const langPrefix = language === "pt" ? "pt" : "en";
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const started = speakMessage({
      messageId,
      text: content,
      langPrefix,
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    });
    if (!started) setSpeaking(false);
  }, [canListen, speechReady, speaking, language, messageId, content]);

  const actionBtn = isUser
    ? "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-white/75 transition hover:bg-white/10 hover:text-white"
    : "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-gray-500 transition hover:bg-gray-200/80 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100";

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      <button type="button" onClick={handleCopy} className={actionBtn} aria-label={t("adminAi.copy")}>
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? t("adminAi.copied") : t("adminAi.copy")}
      </button>
      {canListen && speechReady && (
        <button type="button" onClick={handleListen} className={actionBtn} aria-label={t("adminAi.listen")}>
          {speaking ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          {speaking ? t("adminAi.stop") : t("adminAi.listen")}
        </button>
      )}
    </div>
  );
}

export function AdminAiMessageBubble({
  message,
  onConfirm,
  onCancel,
  onUndo,
  showYesNo,
  onYesNo,
  yesNoDisabled,
  undoing,
}: {
  message: AdminAiMessageData;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onUndo: (id: string) => void;
  showYesNo?: boolean;
  onYesNo?: (answer: "yes" | "no") => void;
  yesNoDisabled?: boolean;
  undoing?: boolean;
}) {
  const { t } = useLanguage();
  const isUser = message.role === "user";
  const variant = message.variant || "assistant";
  const displayContent = isUser ? message.content : stripYesNoMarker(message.content);
  const pendingList = message.pendingActions?.length
    ? message.pendingActions
    : message.pendingAction
      ? [message.pendingAction]
      : [];

  const isSuccessCard =
    variant === "success" &&
    !isUser &&
    (message.successRichPreview || message.links?.length || message.undo);

  if (isSuccessCard) {
    const card = buildSuccessCardProps(message.successRichPreview, message.content, t);
    return (
      <div className="group max-w-[92%]">
        <AdminAiSuccessCard
          title={card.title}
          summary={card.summary || t("adminAi.successSubtitle")}
          details={card.details}
          links={message.links}
          undo={message.undo}
          onUndo={onUndo}
          undoing={undoing}
        />
        <MessageActions messageId={message.id} content={message.content} isUser={false} canListen={false} />
      </div>
    );
  }

  const bubbleClass = isUser
    ? "ml-auto bg-[#857D71] text-white"
    : variant === "error"
      ? "bg-red-50 text-red-900 border border-red-200 dark:bg-red-950/40 dark:text-red-100 dark:border-red-900"
      : variant === "system"
        ? "bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800/50 dark:text-gray-400"
        : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100";

  const showListen = !isUser && !!message.content.trim() && !message.streaming;

  return (
    <div className={cn("group max-w-[92%] rounded-xl px-3 py-2 text-sm", bubbleClass, isUser && "rounded-br-sm")}>
      {!isUser ? (
        <>
          <AdminAiMarkdown content={displayContent} />
          {message.streaming && (
            <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-[#857D71]/60" aria-hidden />
          )}
        </>
      ) : (
        <p className="whitespace-pre-wrap">{displayContent}</p>
      )}

      {showYesNo && onYesNo && pendingList.length === 0 && (
        <AdminAiYesNoButtons
          disabled={yesNoDisabled}
          onYes={() => onYesNo("yes")}
          onNo={() => onYesNo("no")}
        />
      )}

      {pendingList.map((pending) => (
        <AdminAiConfirmCard
          key={pending.id}
          preview={pending.richPreview}
          fallbackText={pending.preview}
          links={pending.links}
          expiresAt={pending.expiresAt}
          confirming={message.confirmingId === pending.id}
          onConfirm={() => onConfirm(pending.id)}
          onCancel={() => onCancel(pending.id)}
        />
      ))}

      {message.content.trim() && !message.streaming && (
        <MessageActions
          messageId={message.id}
          content={message.content}
          isUser={isUser}
          canListen={showListen}
        />
      )}
    </div>
  );
}
