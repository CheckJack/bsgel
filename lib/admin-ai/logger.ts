import { logAdminAction } from "@/lib/admin-logger";
import { db } from "@/lib/db";
import { ADMIN_AI_UNDO_TTL_MS } from "@/lib/admin-ai/config";
import type { AdminAiToolResult } from "@/lib/admin-ai/tools/types";

export async function logAiAction({
  userId,
  conversationId,
  toolName,
  resourceType,
  resourceId,
  description,
  beforeState,
  afterState,
}: {
  userId: string;
  conversationId: string;
  toolName: string;
  resourceType: string;
  resourceId?: string | null;
  description: string;
  beforeState?: unknown;
  afterState?: unknown;
}): Promise<AdminAiToolResult["undoEntry"] | undefined> {
  const log = await logAdminAction({
    userId,
    actionType: "UPDATE",
    resourceType,
    resourceId: resourceId || null,
    description: `[AI] ${description}`,
    details: {
      before: beforeState ?? null,
      after: afterState ?? null,
      toolName,
    },
    metadata: {
      source: "ai-agent",
      conversationId,
      toolName,
      reversible: !!beforeState,
    },
  });

  if (beforeState == null && afterState == null) return undefined;

  const expiresAt = new Date(Date.now() + ADMIN_AI_UNDO_TTL_MS);
  const undo = await db.adminAiUndoEntry.create({
    data: {
      userId,
      conversationId,
      adminLogId: log?.id ?? null,
      toolName,
      resourceType,
      resourceId: resourceId || null,
      description,
      beforeState: (beforeState ?? { _created: true }) as object,
      afterState: afterState != null ? (afterState as object) : undefined,
      expiresAt,
    },
  });

  return {
    id: undo.id,
    adminLogId: undo.adminLogId,
    toolName: undo.toolName,
    resourceType: undo.resourceType,
    resourceId: undo.resourceId,
    description: undo.description,
    beforeState: undo.beforeState,
    afterState: undo.afterState,
    expiresAt: undo.expiresAt,
  };
}
