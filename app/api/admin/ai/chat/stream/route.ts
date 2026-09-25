import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminAi } from "@/lib/admin-ai/auth";
import { runAdminAiAgent } from "@/lib/admin-ai/agent";
import { isRetryableGeminiError } from "@/lib/admin-ai/config";
import { persistPendingActions, toMessageMetadataFromPending } from "@/lib/admin-ai/pending-actions";

export async function POST(req: Request) {
  const { error, session } = await requireAdminAi();
  if (error) return error;

  const body = await req.json();
  const { conversationId, message, pageContext, attachmentContext, imageAttachment } = body;

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "message is required" }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        let conversation = conversationId
          ? await db.adminAiConversation.findFirst({
              where: { id: conversationId, userId: session!.user.id },
              include: { messages: { orderBy: { createdAt: "asc" }, take: 30 } },
            })
          : null;

        if (!conversation) {
          conversation = await db.adminAiConversation.create({
            data: {
              userId: session!.user.id,
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

        let streamedText = "";

        const agentResult = await runAdminAiAgent({
          history,
          userMessage: message.trim(),
          ctx: { userId: session!.user.id, conversationId: conversation.id, pageContext },
          pageContext,
          attachmentContext,
          imageAttachment,
          onStep: (step) => send("step", { text: step }),
          onToken: (token) => {
            streamedText += token;
            send("token", { text: token });
          },
        });

        const pendingList =
          agentResult.pendingActions ||
          (agentResult.pendingAction ? [agentResult.pendingAction] : []);

        const persistedPending = pendingList.length
          ? await persistPendingActions(conversation.id, session!.user.id, pendingList)
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

        send("message", { text: agentResult.message });
        for (const pending of persistedPending) {
          send("pending", pending);
        }
        send("done", {
          conversationId: conversation.id,
          steps: agentResult.steps,
          streamedLength: streamedText.length,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error";
        const friendly = isRetryableGeminiError(e)
          ? "Holo is temporarily busy (Google AI high demand). Please try again in a moment."
          : msg;
        send("error", { message: friendly });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
