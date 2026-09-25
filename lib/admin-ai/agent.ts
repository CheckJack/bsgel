import {
  GoogleGenerativeAI,
  type Content,
  type Part,
} from "@google/generative-ai";
import { getGeminiApiKey, getGeminiModelCandidates, isRetryableGeminiError, isUnavailableGeminiModelError } from "@/lib/admin-ai/config";
import { ADMIN_AI_PLAYBOOK } from "@/lib/admin-ai/playbook";
import { ADMIN_AI_BLOG_PLAYBOOK } from "@/lib/admin-ai/blog-playbook";
import { ADMIN_AI_KNOWLEDGE } from "@/lib/admin-ai/knowledge";
import { ADMIN_AI_TOOL_DECLARATIONS } from "@/lib/admin-ai/tools/declarations";
import { executeTool, getToolStepLabel } from "@/lib/admin-ai/tools/executor";
import { buildRichPreview, richPreviewToText } from "@/lib/admin-ai/preview";
import { getLinksForPendingAction } from "@/lib/admin-ai/links";
import type { AdminAiRichPreview } from "@/lib/admin-ai/types";
import type { AdminAiToolContext } from "@/lib/admin-ai/tools/types";

const MAX_TOOL_ROUNDS = 8;

export type AgentPendingAction = {
  toolName: string;
  arguments: Record<string, unknown>;
  preview: string;
  richPreview?: AdminAiRichPreview;
  links?: { label: string; href: string }[];
};

export type AgentResponse = {
  message: string;
  pendingActions?: AgentPendingAction[];
  /** @deprecated Use pendingActions */
  pendingAction?: AgentPendingAction;
  steps?: string[];
};

export type AgentImageAttachment = {
  mimeType: string;
  base64: string;
};

function buildSystemPrompt(pageContext?: string, attachmentContext?: string): string {
  return `${ADMIN_AI_PLAYBOOK}

${ADMIN_AI_BLOG_PLAYBOOK}

${ADMIN_AI_KNOWLEDGE}

${pageContext ? `Current admin page: ${pageContext}` : ""}
${attachmentContext ? `\nAttached document context:\n${attachmentContext}` : ""}

You are Holo, the Bio Sculpture admin AI assistant. Your name is Holo — use it when introducing yourself.
Use tools for all data lookups and mutations.
For write operations, call the tool — the system will ask the admin to confirm before applying.
Never delete anything. Never cancel orders. Blogs must stay DRAFT.
Match the admin's language (English or Portuguese).

## Response formatting rules:
- Use Markdown: **bold**, bullet lists, and tables when listing products, stock, or orders.
- Keep answers concise and scannable — short sections, not walls of text.
- When showing data, prefer tables with columns: Product | Stock | Status (or similar).
- For actions, summarize what you found before proposing changes.
- Include admin paths as markdown links when helpful, e.g. [View order](/admin/orders/ID).`;
}

function buildUserParts(
  userMessage: string,
  imageAttachment?: AgentImageAttachment
): Part[] {
  const parts: Part[] = [{ text: userMessage }];
  if (imageAttachment) {
    parts.push({
      inlineData: {
        mimeType: imageAttachment.mimeType,
        data: imageAttachment.base64,
      },
    });
  }
  return parts;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type GenerateResult = {
  textParts: string;
  functionCalls: Part[];
};

async function generateContentWithFallback({
  genAI,
  contents,
  systemInstruction,
  onRetry,
  onToken,
}: {
  genAI: GoogleGenerativeAI;
  contents: Content[];
  systemInstruction: string;
  onRetry?: (info: string) => void | Promise<void>;
  onToken?: (token: string) => void | Promise<void>;
}): Promise<GenerateResult> {
  const candidates = getGeminiModelCandidates();
  let lastError: unknown;

  for (let i = 0; i < candidates.length; i++) {
    const modelName = candidates[i]!;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
          tools: [{ functionDeclarations: ADMIN_AI_TOOL_DECLARATIONS }],
        });

        if (onToken) {
          const stream = await model.generateContentStream({ contents });
          let textParts = "";
          const functionCalls: Part[] = [];

          for await (const chunk of stream.stream) {
            const parts = chunk.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
              if (part.text) {
                textParts += part.text;
                await onToken(part.text);
              }
              if (part.functionCall) {
                functionCalls.push(part);
              }
            }
          }

          return { textParts, functionCalls };
        }

        const result = await model.generateContent({ contents });
        const parts = result.response.candidates?.[0]?.content?.parts || [];
        return {
          textParts: parts.filter((p) => p.text).map((p) => p.text).join(""),
          functionCalls: parts.filter((p) => p.functionCall),
        };
      } catch (error) {
        lastError = error;

        if (isUnavailableGeminiModelError(error)) {
          if (i < candidates.length - 1) {
            await onRetry?.(`Trying ${candidates[i + 1]}…`);
            break;
          }
          throw error;
        }

        if (!isRetryableGeminiError(error)) throw error;

        if (attempt === 0) {
          await onRetry?.(`Model busy, retrying…`);
          await sleep(1200);
          continue;
        }

        if (i < candidates.length - 1) {
          await onRetry?.(`Switching to ${candidates[i + 1]}…`);
          await sleep(400);
        }
      }
    }
  }

  throw lastError;
}

export async function runAdminAiAgent({
  history,
  userMessage,
  ctx,
  pageContext,
  attachmentContext,
  imageAttachment,
  onStep,
  onToken,
}: {
  history: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
  ctx: AdminAiToolContext;
  pageContext?: string;
  attachmentContext?: string;
  imageAttachment?: AgentImageAttachment;
  onStep?: (step: string) => void | Promise<void>;
  onToken?: (token: string) => void | Promise<void>;
}): Promise<AgentResponse> {
  const steps: string[] = [];
  const emit = async (step: string) => {
    steps.push(step);
    await onStep?.(step);
  };

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      message:
        "Admin AI is not configured. Add GEMINI_API_KEY to .env.local and set ENABLE_ADMIN_AI=true.",
      steps,
    };
  }

  await emit("Analyzing your request…");

  const genAI = new GoogleGenerativeAI(apiKey);
  const systemInstruction = buildSystemPrompt(pageContext, attachmentContext);

  const contents: Content[] = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: buildUserParts(userMessage, imageAttachment) },
  ];

  let rounds = 0;
  const pendingActions: AgentPendingAction[] = [];

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;
    const { textParts, functionCalls } = await generateContentWithFallback({
      genAI,
      contents,
      systemInstruction,
      onRetry: emit,
      onToken,
    });

    if (!functionCalls.length) {
      await emit("Done.");
      const first = pendingActions[0];
      return {
        message: textParts || "Done.",
        pendingActions: pendingActions.length ? pendingActions : undefined,
        pendingAction: first,
        steps,
      };
    }

    contents.push({ role: "model", parts: functionCalls });

    const functionResponseParts: Part[] = [];

    for (const part of functionCalls) {
      const fc = part.functionCall!;
      const toolName = fc.name;
      const args = (fc.args || {}) as Record<string, unknown>;

      await emit(getToolStepLabel(toolName));

      const outcome = await executeTool(toolName, args, ctx);

      if (outcome.type === "blocked") {
        functionResponseParts.push({
          functionResponse: {
            name: toolName,
            response: { error: outcome.reason },
          },
        });
        continue;
      }

      if (outcome.type === "pending") {
        pendingActions.push({
          toolName: outcome.toolName,
          arguments: outcome.arguments,
          preview: outcome.preview,
          richPreview: outcome.richPreview,
          links: getLinksForPendingAction(outcome.toolName, outcome.arguments),
        });
        await emit("Waiting for your confirmation…");
        functionResponseParts.push({
          functionResponse: {
            name: toolName,
            response: {
              status: "pending_confirmation",
              preview: outcome.preview,
            },
          },
        });
        continue;
      }

      const { result: toolResult } = outcome;
      functionResponseParts.push({
        functionResponse: {
          name: toolName,
          response: toolResult.success
            ? { data: toolResult.data, preview: toolResult.preview }
            : { error: toolResult.error },
        },
      });
    }

    contents.push({ role: "user", parts: functionResponseParts });

    if (pendingActions.length > 0) {
      const enriched = await Promise.all(
        pendingActions.map(async (p) => ({
          ...p,
          richPreview: p.richPreview || (await buildRichPreview(p.toolName, p.arguments)),
        }))
      );
      const previewTexts = enriched.map((p) => richPreviewToText(p.richPreview!));
      const confirmMsg =
        textParts ||
        (enriched.length === 1
          ? `I prepared the following change. Please review and confirm:\n\n${previewTexts[0]}`
          : `I prepared ${enriched.length} changes. Please review and confirm each one:\n\n${previewTexts.map((t, i) => `**${i + 1}.** ${t}`).join("\n\n")}`);
      const first = enriched[0];
      return {
        message: confirmMsg,
        pendingActions: enriched,
        pendingAction: first,
        steps,
      };
    }
  }

  const first = pendingActions[0];
  return {
    message: "I reached the maximum number of tool steps. Please try a simpler request.",
    pendingActions: pendingActions.length ? pendingActions : undefined,
    pendingAction: first,
    steps,
  };
}
