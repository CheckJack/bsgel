import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminAi } from "@/lib/admin-ai/auth";
import { undoAiAction } from "@/lib/admin-ai/undo";

export async function POST(req: Request) {
  const { error, session } = await requireAdminAi();
  if (error) return error;

  const { undoId } = await req.json() as { undoId?: string };
  if (!undoId) {
    return NextResponse.json({ error: "undoId required" }, { status: 400 });
  }

  const result = await undoAiAction(undoId, session!.user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  const entry = await db.adminAiUndoEntry.findUnique({ where: { id: undoId } });
  if (entry?.conversationId) {
    await db.adminAiMessage.create({
      data: {
        conversationId: entry.conversationId,
        role: "ASSISTANT",
        content: `↩ Undone: ${entry.description}`,
      },
    });
  }

  return NextResponse.json({ success: true, message: result.message });
}

export async function GET(req: Request) {
  const { error, session } = await requireAdminAi();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId") || undefined;

  const entries = await db.adminAiUndoEntry.findMany({
    where: {
      userId: session!.user.id,
      undoneAt: null,
      expiresAt: { gt: new Date() },
      ...(conversationId ? { conversationId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      description: true,
      toolName: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ entries });
}
