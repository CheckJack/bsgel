import { READ_TOOL_HANDLERS } from "@/lib/admin-ai/tools/read-tools";
import { WRITE_TOOL_HANDLERS } from "@/lib/admin-ai/tools/write-tools";
import {
  isToolAllowed,
  requiresConfirmation,
  validateWritePayload,
} from "@/lib/admin-ai/policy";
import { buildRichPreview, richPreviewToText } from "@/lib/admin-ai/preview";
import type { AdminAiRichPreview } from "@/lib/admin-ai/types";
import type { AdminAiToolContext, AdminAiToolResult } from "@/lib/admin-ai/tools/types";

export type ToolExecutionOutcome =
  | { type: "result"; result: AdminAiToolResult }
  | {
      type: "pending";
      preview: string;
      richPreview: AdminAiRichPreview;
      toolName: string;
      arguments: Record<string, unknown>;
    }
  | { type: "blocked"; reason: string };

const TOOL_STEP_LABELS: Record<string, string> = {
  get_dashboard_stats: "Fetching dashboard stats…",
  list_stock: "Checking stock levels…",
  search_products: "Searching products…",
  list_products: "Loading products…",
  get_product: "Loading product details…",
  list_orders: "Loading orders…",
  get_order: "Loading order details…",
  add_incoming_stock: "Preparing stock update…",
  bulk_update_stock: "Preparing bulk stock update…",
  update_product_stock: "Preparing stock change…",
  create_product: "Preparing new product…",
  create_blog_draft: "Preparing SEO blog draft…",
  fetch_web_page: "Reading web page…",
  get_blog: "Loading blog post…",
  create_coupon: "Preparing coupon…",
};

export function getToolStepLabel(toolName: string): string {
  return TOOL_STEP_LABELS[toolName] || `Running ${toolName.replace(/_/g, " ")}…`;
}

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  ctx: AdminAiToolContext,
  options?: { skipConfirmation?: boolean }
): Promise<ToolExecutionOutcome> {
  if (!isToolAllowed(toolName)) {
    return { type: "blocked", reason: `Action "${toolName}" is not permitted.` };
  }

  const validationError = validateWritePayload(toolName, args);
  if (validationError) {
    return { type: "blocked", reason: validationError };
  }

  if (requiresConfirmation(toolName) && !options?.skipConfirmation) {
    const handler = WRITE_TOOL_HANDLERS[toolName];
    if (!handler) {
      return { type: "blocked", reason: `Unknown write tool: ${toolName}` };
    }
    const richPreview = await buildRichPreview(toolName, args);
    return {
      type: "pending",
      preview: richPreviewToText(richPreview),
      richPreview,
      toolName,
      arguments: args,
    };
  }

  const readHandler = READ_TOOL_HANDLERS[toolName];
  if (readHandler) {
    const result = await readHandler(args, ctx);
    return { type: "result", result };
  }

  const writeHandler = WRITE_TOOL_HANDLERS[toolName];
  if (writeHandler) {
    const result = await writeHandler(args, ctx);
    return { type: "result", result };
  }

  return { type: "blocked", reason: `Unknown tool: ${toolName}` };
}

export async function executeConfirmedTool(
  toolName: string,
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const handler = WRITE_TOOL_HANDLERS[toolName];
  if (!handler) {
    return { success: false, error: `Unknown write tool: ${toolName}` };
  }

  const validationError = validateWritePayload(toolName, args);
  if (validationError) {
    return { success: false, error: validationError };
  }

  return handler(args, ctx);
}
