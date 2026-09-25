import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminAi } from "@/lib/admin-ai/auth";
import { runAdminAiAgent } from "@/lib/admin-ai/agent";
import { persistPendingActions, toMessageMetadataFromPending } from "@/lib/admin-ai/pending-actions";

async function handleChat(body: {
  conversationId?: string;
  message?: string;
  pageContext?: string;
  attachmentContext?: string;
  imageAttachment?: { mimeType: string; base64: string };
  onStep?: (step: string) => void | Promise<void>;
}, session: { user: { id: string } }) {
  const { conversationId, message, pageContext, attachmentContext, imageAttachment, onStep } = body;

  if (!message?.trim()) {
    return { error: "message is required", status: 400 as const };
  }

  let conversation = conversationId
    ? await db.adminAiConversation.findFirst({
        where: { id: conversationId, userId: session.user.id },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 30 } },
      })
    : null;

  if (!conversation) {
    conversation = await db.adminAiConversation.create({
      data: {
        userId: session.user.id,
        title: message.trim().slice(0, 80),
        pageContext: pageContext || null,
        messages: { create: { role: "USER", content: message.trim() } },
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  } else {
    await db.adminAiMessage.create({
      data: { conversationId: conversation.id, role: "USER", content: message.trim() },
    });
  }

  const history = conversation.messages
    .filter((m) => m.role !== "SYSTEM")
    .slice(-20)
    .map((m) => ({
      role: m.role === "ASSISTANT" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

  const agentResult = await runAdminAiAgent({
    history,
    userMessage: message.trim(),
    ctx: { userId: session.user.id, conversationId: conversation.id, pageContext },
    pageContext,
    attachmentContext,
    imageAttachment,
    onStep,
  });

  const pendingList =
    agentResult.pendingActions ||
    (agentResult.pendingAction ? [agentResult.pendingAction] : []);

  const persistedPending = pendingList.length
    ? await persistPendingActions(conversation.id, session.user.id, pendingList)
    : [];

  await db.adminAiMessage.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: agentResult.message,
      metadata: toMessageMetadataFromPending(persistedPending),
    },
  });

  await db.adminAiConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date(), pageContext: pageContext || conversation.pageContext },
  });

  return {
    conversationId: conversation.id,
    message: agentResult.message,
    steps: agentResult.steps,
    pendingActions: persistedPending,
    pendingAction: persistedPending[0],
  };
}

export async function POST(req: Request) {
  const { error, session } = await requireAdminAi();
  if (error) return error;

  const body = await req.json();
  const result = await handleChat(body, session!);

  if ("error" in result && result.status) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
