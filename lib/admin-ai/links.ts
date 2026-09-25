import type { AdminAiActionLink } from "@/lib/admin-ai/types";

export function getLinksForToolResult(
  toolName: string,
  data: unknown
): AdminAiActionLink[] {
  if (!data || typeof data !== "object") return [];

  const d = data as Record<string, unknown>;
  const links: AdminAiActionLink[] = [];

  if (toolName.includes("product") && d.id) {
    links.push({ label: "View product", href: `/admin/products/${d.id}` });
    links.push({ label: "Stock", href: `/admin/stock` });
  }

  if (toolName.includes("order") && d.id) {
    links.push({ label: "View order", href: `/admin/orders/${d.id}` });
  }

  if (toolName === "create_blog_draft" && d.id) {
    links.push({ label: "Edit draft", href: `/admin/blogs/${d.id}` });
  }

  if (toolName === "create_coupon" && d.id) {
    links.push({ label: "View coupon", href: `/admin/coupons/${d.id}` });
  }

  if (toolName === "add_incoming_stock" && Array.isArray((d as { updates?: unknown }).updates)) {
    links.push({ label: "Open stock", href: `/admin/stock` });
  }

  return links;
}

export function getLinksForPendingAction(
  toolName: string,
  args: Record<string, unknown>
): AdminAiActionLink[] {
  if (args.productId) {
    return [{ label: "View product", href: `/admin/products/${args.productId}` }];
  }
  if (args.orderId) {
    return [{ label: "View order", href: `/admin/orders/${args.orderId}` }];
  }
  if (args.blogId) {
    return [{ label: "View blog", href: `/admin/blogs/${args.blogId}` }];
  }
  if (toolName === "bulk_update_stock" || toolName === "add_incoming_stock") {
    return [{ label: "Open stock", href: `/admin/stock` }];
  }
  return [];
}
