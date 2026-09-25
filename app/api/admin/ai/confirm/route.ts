import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminAi } from "@/lib/admin-ai/auth";
import { executeConfirmedTool } from "@/lib/admin-ai/tools/executor";
import { getLinksForToolResult } from "@/lib/admin-ai/links";
import { buildRichPreview } from "@/lib/admin-ai/preview";
import { toMessageMetadata } from "@/lib/admin-ai/metadata";

export async function POST(req: Request) {
  const { error, session } = await requireAdminAi();
  if (error) return error;

  const { pendingActionId, action } = await req.json() as {
    pendingActionId?: string;
    action?: "confirm" | "cancel";
  };

  if (!pendingActionId) {
    return NextResponse.json({ error: "pendingActionId required" }, { status: 400 });
  }

  const pending = await db.adminAiPendingAction.findFirst({
    where: { id: pendingActionId, userId: session!.user.id, status: "PENDING" },
  });

  if (!pending) {
    return NextResponse.json({ error: "Pending action not found" }, { status: 404 });
  }

  if (pending.expiresAt < new Date()) {
    await db.adminAiPendingAction.update({ where: { id: pending.id }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "Confirmation expired" }, { status: 410 });
  }

  if (action === "cancel") {
    await db.adminAiPendingAction.update({ where: { id: pending.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ cancelled: true, message: "__cancelled__" });
  }

  const result = await executeConfirmedTool(
    pending.toolName,
    pending.arguments as Record<string, unknown>,
    { userId: session!.user.id, conversationId: pending.conversationId }
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error || "Action failed" }, { status: 400 });
  }

  await db.adminAiPendingAction.update({
    where: { id: pending.id },
    data: { status: "CONFIRMED", result: result.data as object },
  });

  const undo = result.undoEntry?.id
    ? {
        id: result.undoEntry.id,
        description: result.undoEntry.description,
        expiresAt: result.undoEntry.expiresAt?.toISOString() || new Date(Date.now() + 3600000).toISOString(),
      }
    : undefined;

  const richPreview = await buildRichPreview(pending.toolName, pending.arguments as Record<string, unknown>);
  const links = getLinksForToolResult(pending.toolName, result.data);
  const confirmMessage = result.preview ? `✓ ${result.preview}` : "✓ __applied__";

  await db.adminAiMessage.create({
    data: {
      conversationId: pending.conversationId,
      role: "ASSISTANT",
      content: confirmMessage,
      metadata: toMessageMetadata({
        isSuccess: true,
        undoId: undo?.id,
        undoDescription: undo?.description,
        undoExpiresAt: undo?.expiresAt,
        links,
        preview: richPreview,
      }),
    },
  });

  return NextResponse.json({
    success: true,
    message: confirmMessage,
    data: result.data,
    links,
    richPreview,
    undo,
  });
}
