import { db } from "@/lib/db";
import type { AdminAiRichPreview, AdminAiPreviewRow } from "@/lib/admin-ai/types";
import { resolveBulkStockProductIds } from "@/lib/admin-ai/stock-query";
import {
  markdownToBlogHtml,
  buildSeoExcerpt,
  buildSeoSlug,
  summarizeBlogStructure,
} from "@/lib/admin-ai/blog-content";

async function productLabel(id: string): Promise<string> {
  const p = await db.product.findUnique({
    where: { id },
    select: { name: true, stockQuantity: true },
  });
  if (!p) return id.slice(0, 12) + "…";
  return `${p.name} (current: ${p.stockQuantity})`;
}

export async function buildRichPreview(
  toolName: string,
  args: Record<string, unknown>
): Promise<AdminAiRichPreview> {
  const rows: AdminAiPreviewRow[] = [];

  switch (toolName) {
    case "update_product_stock": {
      const name = await productLabel(String(args.productId));
      rows.push({
        label: name,
        before: "current",
        after: String(args.stockQuantity),
      });
      return {
        toolName,
        title: "Update stock",
        summary: `Set stock to ${args.stockQuantity}`,
        rows,
      };
    }
    case "bulk_update_stock": {
      const resolved = await resolveBulkStockProductIds(args);
      const ids = resolved.productIds;
      const names = await db.product.findMany({
        where: { id: { in: ids.slice(0, 15) } },
        select: { name: true, stockQuantity: true },
      });
      for (const p of names) {
        rows.push({
          label: p.name,
          before: String(p.stockQuantity),
          after: String(args.stockQuantity),
        });
      }
      if (ids.length > names.length) {
        rows.push({ label: `+${ids.length - names.length} more products`, after: String(args.stockQuantity) });
      }
      const allProducts = args.allProducts === true || args.allProducts === "true";
      return {
        toolName,
        title: "Bulk stock update",
        summary: `${ids.length} product(s)${allProducts ? " (entire catalog)" : ""} → stock ${args.stockQuantity}`,
        rows,
      };
    }
    case "add_incoming_stock": {
      const items = (args.items as { productId?: string; productName?: string; incomingQuantity: number }[]) || [];
      for (const item of items) {
        let name = item.productName || "";
        let current = "?";
        if (item.productId) {
          const p = await db.product.findUnique({
            where: { id: item.productId },
            select: { name: true, stockQuantity: true },
          });
          if (p) {
            name = p.name;
            current = String(p.stockQuantity);
          }
        } else if (item.productName) {
          const p = await db.product.findFirst({
            where: { name: { contains: item.productName, mode: "insensitive" } },
            select: { name: true, stockQuantity: true },
          });
          if (p) {
            name = p.name;
            current = String(p.stockQuantity);
          }
        }
        const incoming = item.incomingQuantity;
        const after = current !== "?" ? String(Number(current) + incoming) : `+${incoming}`;
        rows.push({
          label: name || item.productId || "Unknown",
          before: current,
          after,
          detail: `+${incoming} incoming`,
        });
      }
      return {
        toolName,
        title: "Incoming supplier stock",
        summary: `${items.length} product line(s)`,
        rows,
      };
    }
    case "create_product":
      rows.push({ label: String(args.name), detail: `€${args.price}` });
      if (args.stockQuantity != null) rows.push({ label: "Stock", after: String(args.stockQuantity) });
      return { toolName, title: "Create product", summary: String(args.name), rows };
    case "update_product": {
      const name = await productLabel(String(args.productId));
      const updates = (args.updates as Record<string, unknown>) || {};
      for (const [k, v] of Object.entries(updates)) {
        rows.push({ label: name, detail: `${k}: ${JSON.stringify(v)}` });
      }
      return { toolName, title: "Update product", summary: name, rows };
    }
    case "update_order_status":
      rows.push({ label: `Order ${String(args.orderId).slice(0, 10)}…`, after: String(args.status) });
      return { toolName, title: "Update order status", summary: String(args.status), rows };
    case "create_blog_draft":
    case "update_blog_draft": {
      const updates = (args.updates as Record<string, unknown> | undefined) || {};
      const title = String(updates.title ?? args.title ?? "");
      const slug = updates.slug != null ? String(updates.slug) : args.slug ? String(args.slug) : undefined;
      const excerptArg = updates.excerpt != null ? String(updates.excerpt) : args.excerpt ? String(args.excerpt) : undefined;
      const raw = String(updates.content ?? args.content ?? "");
      const html = raw ? markdownToBlogHtml(raw) : "";
      const excerpt = buildSeoExcerpt(excerptArg, html, title || "Blog draft");
      const rows: AdminAiPreviewRow[] = [
        { label: "Title", detail: title },
        { label: "Slug", detail: buildSeoSlug(slug, title || "Blog draft") },
        { label: "Excerpt (SEO)", detail: excerpt },
      ];
      if (html) {
        rows.push({ label: "Structure", detail: summarizeBlogStructure(html) });
        const headings = Array.from(html.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi))
          .slice(0, 6)
          .map((m) => `H${m[1]}: ${m[2].replace(/<[^>]+>/g, "").trim()}`);
        for (const h of headings) {
          rows.push({ label: "Section", detail: h });
        }
      }
      return {
        toolName,
        title: toolName === "create_blog_draft" ? "Create blog draft" : "Update blog draft",
        summary: title || "Blog",
        rows,
      };
    }
    case "create_coupon":
      return {
        toolName,
        title: "Create coupon",
        summary: String(args.code),
        rows: [{ label: String(args.code), detail: `${args.discountType || "PERCENTAGE"} ${args.discountValue}` }],
      };
    default:
      return {
        toolName,
        title: toolName,
        summary: JSON.stringify(args),
        rows: [{ label: "Details", detail: JSON.stringify(args) }],
      };
  }
}

export function richPreviewToText(preview: AdminAiRichPreview): string {
  const lines = [preview.title, preview.summary, ""];
  for (const row of preview.rows) {
    if (row.before && row.after) {
      lines.push(`• ${row.label}: ${row.before} → ${row.after}${row.detail ? ` (${row.detail})` : ""}`);
    } else {
      lines.push(`• ${row.label}${row.detail ? `: ${row.detail}` : ""}${row.after ? ` → ${row.after}` : ""}`);
    }
  }
  return lines.join("\n");
}
