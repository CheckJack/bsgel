import { db } from "@/lib/db";
import { ADMIN_AI_PENDING_TTL_MS } from "@/lib/admin-ai/config";
import { getLinksForPendingAction } from "@/lib/admin-ai/links";
import { toMessageMetadata } from "@/lib/admin-ai/metadata";
import type { AgentPendingAction } from "@/lib/admin-ai/agent";
import type { AdminAiChatMessageMeta } from "@/lib/admin-ai/types";

export type PersistedPendingAction = AgentPendingAction & {
  id: string;
  expiresAt: string;
};

export async function persistPendingActions(
  conversationId: string,
  userId: string,
  actions: AgentPendingAction[]
): Promise<PersistedPendingAction[]> {
  const expiresAt = new Date(Date.now() + ADMIN_AI_PENDING_TTL_MS);
  const results: PersistedPendingAction[] = [];

  for (const action of actions) {
    const pending = await db.adminAiPendingAction.create({
      data: {
        conversationId,
        userId,
        toolName: action.toolName,
        arguments: action.arguments as object,
        preview: action.preview,
        expiresAt,
      },
    });
    results.push({
      ...action,
      id: pending.id,
      expiresAt: expiresAt.toISOString(),
      links:
        action.links ||
        getLinksForPendingAction(action.toolName, action.arguments),
    });
  }

  return results;
}

export function buildPendingMessageMetadata(
  persisted: PersistedPendingAction[]
): AdminAiChatMessageMeta | undefined {
  if (!persisted.length) return undefined;

  return {
    pendingActionId: persisted[0]!.id,
    pendingActions: persisted.map((p) => ({
      id: p.id,
      toolName: p.toolName,
      preview: p.richPreview,
      links: p.links,
      expiresAt: p.expiresAt,
    })),
    toolName: persisted[0]!.toolName,
    preview: persisted[0]!.richPreview,
    links: persisted[0]!.links,
  };
}

export function toMessageMetadataFromPending(persisted: PersistedPendingAction[]) {
  const meta = buildPendingMessageMetadata(persisted);
  return meta ? toMessageMetadata(meta) : undefined;
}
