export type AdminAiToolTier = "read" | "write" | "blocked";

const BLOCKED_TOOLS = new Set([
  "delete_product",
  "delete_category",
  "delete_blog",
  "delete_coupon",
  "delete_order",
  "delete_attribute",
  "delete_notification",
  "cancel_order",
  "change_user_role",
  "update_user_role",
  "issue_refund",
  "delete_anything",
]);

const READ_TOOLS = new Set([
  "get_dashboard_stats",
  "search_admin_logs",
  "list_products",
  "get_product",
  "search_products",
  "list_stock",
  "list_orders",
  "get_order",
  "list_categories",
  "get_category",
  "list_attributes",
  "list_reviews",
  "list_coupons",
  "list_blogs",
  "get_blog",
  "fetch_web_page",
  "get_analytics_summary",
  "list_notifications",
  "list_customers",
  "list_shipping_zones",
  "list_chat_messages",
  "list_training_programs",
  "list_training_bookings",
  "list_affiliates",
  "list_rewards",
  "list_certifications",
  "list_salons",
  "list_gallery_items",
  "list_pages",
  "list_undoable_actions",
]);

export function getToolTier(toolName: string): AdminAiToolTier {
  if (BLOCKED_TOOLS.has(toolName)) return "blocked";
  if (READ_TOOLS.has(toolName)) return "read";
  return "write";
}

export function isToolAllowed(toolName: string): boolean {
  return getToolTier(toolName) !== "blocked";
}

export function requiresConfirmation(toolName: string): boolean {
  return getToolTier(toolName) === "write";
}

export function validateWritePayload(
  toolName: string,
  args: Record<string, unknown>
): string | null {
  if (toolName === "update_order_status") {
    const status = String(args.status || "").toUpperCase();
    if (status === "CANCELLED") {
      return "The AI cannot cancel orders.";
    }
  }

  if (toolName === "create_blog_draft" || toolName === "update_blog_draft") {
    if (args.status === "PUBLISHED") {
      return "Blogs must be saved as DRAFT for human review.";
    }
  }

  if (toolName === "bulk_update_stock") {
    const qty = Number(args.stockQuantity);
    if (!Number.isInteger(qty) || qty < 0) {
      return "Stock quantity must be a non-negative integer.";
    }
    const hasIds = Array.isArray(args.productIds) && args.productIds.length > 0;
    const allProducts = args.allProducts === true || args.allProducts === "true";
    if (!hasIds && !allProducts) {
      return "Provide productIds for a specific list, or set allProducts:true for the full catalog.";
    }
  }

  return null;
}
