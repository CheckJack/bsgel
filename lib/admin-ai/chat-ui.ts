import { getLinksForPendingAction } from "@/lib/admin-ai/links";
import type { AdminAiMessageData, AdminAiPendingActionData } from "@/components/admin/admin-ai/admin-ai-message-bubble";
import type { AdminAiChatMessageMeta, AdminAiRichPreview } from "@/lib/admin-ai/types";

type PendingActionLookup = Record<
  string,
  {
    toolName: string;
    preview: string;
    arguments: Record<string, unknown>;
    status: string;
    expiresAt?: Date;
  }
>;

function buildPendingActionUi(
  id: string,
  meta: AdminAiChatMessageMeta,
  pending?: PendingActionLookup[string],
  richPreview?: AdminAiRichPreview
): AdminAiPendingActionData | undefined {
  if (!pending || pending.status !== "PENDING") return undefined;

  const preview = meta.pendingActions?.find((p) => p.id === id)?.preview || richPreview;
  const links =
    meta.pendingActions?.find((p) => p.id === id)?.links ||
    meta.links ||
    getLinksForPendingAction(pending.toolName, pending.arguments);

  return {
    id,
    preview: pending.preview || preview?.summary || "",
    richPreview: preview,
    toolName: meta.pendingActions?.find((p) => p.id === id)?.toolName || meta.toolName || pending.toolName,
    links,
    expiresAt:
      meta.pendingActions?.find((p) => p.id === id)?.expiresAt ||
      pending.expiresAt?.toISOString(),
  };
}

export function mapDbMessagesToUi(
  messages: {
    id: string;
    role: string;
    content: string;
    metadata: unknown;
    createdAt: Date;
  }[],
  pendingById?: PendingActionLookup
): AdminAiMessageData[] {
  return messages.map((m) => {
    const meta = (m.metadata || {}) as AdminAiChatMessageMeta;
    const variant =
      meta.isError || m.content.toLowerCase().includes("error") || m.content.startsWith("Failed")
        ? ("error" as const)
        : m.content.startsWith("✓") || meta.isSuccess
          ? ("success" as const)
          : ("assistant" as const);

    const richPreview = meta.preview as AdminAiRichPreview | undefined;
    const pendingIds = meta.pendingActions?.map((p) => p.id) || (meta.pendingActionId ? [meta.pendingActionId] : []);

    const pendingActions = pendingIds
      .map((id) => buildPendingActionUi(id, meta, pendingById?.[id], richPreview))
      .filter((p): p is NonNullable<typeof p> => !!p);

    const firstPending = pendingActions[0];

    return {
      id: m.id,
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content,
      variant: m.role === "USER" ? undefined : variant,
      createdAt: m.createdAt.toISOString(),
      pendingActions: pendingActions.length ? pendingActions : undefined,
      pendingAction: firstPending,
      undo: meta.undoId
        ? {
            id: meta.undoId,
            description: meta.undoDescription || "",
            expiresAt: meta.undoExpiresAt || new Date(Date.now() + 3600000).toISOString(),
          }
        : undefined,
      links: meta.links,
      successRichPreview: meta.isSuccess && richPreview ? richPreview : undefined,
    };
  });
}
