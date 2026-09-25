import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminAi } from "@/lib/admin-ai/auth";
import { mapDbMessagesToUi } from "@/lib/admin-ai/chat-ui";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdminAi();
  if (error) return error;

  const { id } = await params;
  const conversation = await db.adminAiConversation.findFirst({
    where: { id, userId: session!.user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      pendingActions: { where: { status: "PENDING" } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pendingById = Object.fromEntries(
    conversation.pendingActions.map((p) => [
      p.id,
      {
        toolName: p.toolName,
        preview: p.preview,
        arguments: p.arguments as Record<string, unknown>,
        status: p.status,
        expiresAt: p.expiresAt,
      },
    ])
  );

  return NextResponse.json({
    id: conversation.id,
    title: conversation.title,
    pageContext: conversation.pageContext,
    updatedAt: conversation.updatedAt,
    messages: mapDbMessagesToUi(conversation.messages, pendingById),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdminAi();
  if (error) return error;

  const { id } = await params;
  const conversation = await db.adminAiConversation.findFirst({
    where: { id, userId: session!.user.id },
    select: { id: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.adminAiConversation.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
