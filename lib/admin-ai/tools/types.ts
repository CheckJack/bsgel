import type { AdminAiUndoEntry } from "@prisma/client";

export type AdminAiToolContext = {
  userId: string;
  conversationId: string;
  pageContext?: string;
};

export type AdminAiToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
  preview?: string;
  undoEntry?: Omit<
    AdminAiUndoEntry,
    "createdAt" | "undoneAt" | "userId" | "conversationId"
  > & { id?: string; expiresAt?: Date };
};

export type AdminAiToolHandler = (
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
) => Promise<AdminAiToolResult>;
