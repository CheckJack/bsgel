import { db } from "@/lib/db";
import { updateProductStock, bulkUpdateProductStock } from "@/lib/stock";
import { normalizeSlug } from "@/lib/blog";
import {
  markdownToBlogHtml,
  buildSeoExcerpt,
  buildSeoSlug,
  summarizeBlogStructure,
} from "@/lib/admin-ai/blog-content";
import { logAiAction } from "@/lib/admin-ai/logger";
import { executeAddIncomingStock } from "@/lib/admin-ai/undo";
import { resolveBulkStockProductIds } from "@/lib/admin-ai/stock-query";
import type { AdminAiToolContext, AdminAiToolResult } from "@/lib/admin-ai/tools/types";
import { ensureUniqueProductSlug } from "@/lib/products/resolve";

function decimal(value: unknown): number {
  return parseFloat(String(value));
}

export async function updateProductStockTool(
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const productId = String(args.productId || "");
  const stockQuantity = Number(args.stockQuantity);
  if (!productId || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return { success: false, error: "productId and non-negative stockQuantity required." };
  }

  const before = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, stockQuantity: true },
  });
  if (!before) return { success: false, error: "Product not found." };

  await updateProductStock(productId, stockQuantity);
  const preview = `${before.name}: stock ${before.stockQuantity} → ${stockQuantity}`;

  const undoEntry = await logAiAction({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    toolName: "update_product_stock",
    resourceType: "Product",
    resourceId: productId,
    description: preview,
    beforeState: { stockQuantity: before.stockQuantity },
    afterState: { stockQuantity },
  });

  return { success: true, data: { productId, stockQuantity }, preview, undoEntry };
}

export async function bulkUpdateStockTool(
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const stockQuantity = Number(args.stockQuantity);
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return { success: false, error: "stockQuantity must be a non-negative integer." };
  }

  const resolved = await resolveBulkStockProductIds(args);
  if (resolved.error) {
    return { success: false, error: resolved.error };
  }

  const { productIds, total } = resolved;

  const before = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, stockQuantity: true },
  });

  await bulkUpdateProductStock(productIds, stockQuantity);
  const preview = before
    .slice(0, 10)
    .map((p) => `${p.name}: ${p.stockQuantity} → ${stockQuantity}`)
    .join("\n");
  const previewSuffix = total > 10 ? `\n… and ${total - 10} more products` : "";

  const undoEntry = await logAiAction({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    toolName: "bulk_update_stock",
    resourceType: "Product",
    description: `Bulk stock update (${total} products → ${stockQuantity})`,
    beforeState: { items: before.map((p) => ({ productId: p.id, stockQuantity: p.stockQuantity })) },
    afterState: { stockQuantity, productIds, allProducts: args.allProducts === true || args.allProducts === "true" },
  });

  return {
    success: true,
    data: { updated: before.length, total, stockQuantity },
    preview: preview + previewSuffix,
    undoEntry,
  };
}

export async function updateProductTool(
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const productId = String(args.productId || "");
  const updates = (args.updates as Record<string, unknown>) || {};
  if (!productId || !Object.keys(updates).length) {
    return { success: false, error: "productId and updates required." };
  }

  const before = await db.product.findUnique({ where: { id: productId } });
  if (!before) return { success: false, error: "Product not found." };

  const allowed = ["name", "description", "price", "salePrice", "featured", "categoryId", "image", "hemaFree"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) data[key] = updates[key];
  }
  if (updates.stockQuantity !== undefined) {
    const qty = Number(updates.stockQuantity);
    if (Number.isInteger(qty) && qty >= 0) {
      await updateProductStock(productId, qty);
    }
  }

  const updated = Object.keys(data).length
    ? await db.product.update({ where: { id: productId }, data: data as never })
    : before;

  const preview = `Updated product "${before.name}": ${Object.keys(updates).join(", ")}`;
  const undoEntry = await logAiAction({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    toolName: "update_product",
    resourceType: "Product",
    resourceId: productId,
    description: preview,
    beforeState: before,
    afterState: updated,
  });

  return { success: true, data: updated, preview, undoEntry };
}

export async function createProductTool(
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const name = String(args.name || "").trim();
  const price = decimal(args.price);
  if (!name || Number.isNaN(price) || price < 0) {
    return { success: false, error: "name and price are required." };
  }

  const stockQuantity = args.stockQuantity !== undefined ? Number(args.stockQuantity) : 0;
  const product = await db.product.create({
    data: {
      name,
      slug: await ensureUniqueProductSlug(name),
      description: args.description ? String(args.description) : null,
      price,
      salePrice: args.salePrice != null ? decimal(args.salePrice) : null,
      image: args.image ? String(args.image) : null,
      categoryId: args.categoryId ? String(args.categoryId) : null,
      stockQuantity: Number.isInteger(stockQuantity) && stockQuantity >= 0 ? stockQuantity : 0,
      outOfStock: stockQuantity <= 0,
      featured: !!args.featured,
    },
  });

  const preview = `Created product "${product.name}" (€${product.price}, stock ${product.stockQuantity})`;
  const undoEntry = await logAiAction({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    toolName: "create_product",
    resourceType: "Product",
    resourceId: product.id,
    description: preview,
    beforeState: null,
    afterState: product,
  });

  return { success: true, data: product, preview, undoEntry };
}

export async function updateOrderStatusTool(
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const orderId = String(args.orderId || "");
  const status = String(args.status || "").toUpperCase();
  if (!orderId || !status) return { success: false, error: "orderId and status required." };
  if (status === "CANCELLED") return { success: false, error: "Cannot cancel orders." };

  const before = await db.order.findUnique({ where: { id: orderId } });
  if (!before) return { success: false, error: "Order not found." };

  const updated = await db.order.update({
    where: { id: orderId },
    data: { status: status as never },
  });

  const preview = `Order ${orderId.slice(0, 8)}…: ${before.status} → ${status}`;
  const undoEntry = await logAiAction({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    toolName: "update_order_status",
    resourceType: "Order",
    resourceId: orderId,
    description: preview,
    beforeState: { status: before.status },
    afterState: { status },
  });

  return { success: true, data: updated, preview, undoEntry };
}

export async function updateReviewStatusTool(
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const reviewId = String(args.reviewId || "");
  const status = String(args.status || "").toUpperCase();
  if (!reviewId || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return { success: false, error: "reviewId and status (APPROVED/REJECTED) required." };
  }

  const before = await db.productReview.findUnique({ where: { id: reviewId } });
  if (!before) return { success: false, error: "Review not found." };

  const updated = await db.productReview.update({
    where: { id: reviewId },
    data: { status: status as never, reviewedAt: new Date(), reviewedBy: ctx.userId },
  });

  const preview = `Review ${reviewId.slice(0, 8)}…: ${before.status} → ${status}`;
  const undoEntry = await logAiAction({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    toolName: "update_review_status",
    resourceType: "ProductReview",
    resourceId: reviewId,
    description: preview,
    beforeState: { status: before.status },
    afterState: { status },
  });

  return { success: true, data: updated, preview, undoEntry };
}

export async function createCouponTool(
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const code = String(args.code || "").toUpperCase().trim();
  const discountType = String(args.discountType || "PERCENTAGE").toUpperCase();
  const discountValue = decimal(args.discountValue);
  if (!code || Number.isNaN(discountValue)) {
    return { success: false, error: "code and discountValue required." };
  }

  const coupon = await db.coupon.create({
    data: {
      code,
      description: args.description ? String(args.description) : null,
      discountType: discountType as never,
      discountValue,
      minPurchaseAmount: args.minPurchaseAmount != null ? decimal(args.minPurchaseAmount) : null,
      validUntil: args.validUntil ? new Date(String(args.validUntil)) : null,
      isActive: args.isActive !== false,
    },
  });

  const preview = `Created coupon ${coupon.code} (${discountType} ${discountValue})`;
  const undoEntry = await logAiAction({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    toolName: "create_coupon",
    resourceType: "Coupon",
    resourceId: coupon.id,
    description: preview,
    beforeState: null,
    afterState: coupon,
  });

  return { success: true, data: coupon, preview, undoEntry };
}

export async function createBlogDraftTool(
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const title = String(args.title || "").trim();
  const rawContent = String(args.content || "");
  if (!title) return { success: false, error: "title is required." };
  if (!rawContent.trim()) return { success: false, error: "content is required." };

  const content = markdownToBlogHtml(rawContent);
  const slug = buildSeoSlug(args.slug ? String(args.slug) : undefined, title);
  const excerpt = buildSeoExcerpt(args.excerpt ? String(args.excerpt) : undefined, content, title);

  const blog = await db.blog.create({
    data: {
      title,
      slug: normalizeSlug(slug),
      excerpt,
      content,
      status: "DRAFT",
      createdBy: ctx.userId,
    },
  });

  const structure = summarizeBlogStructure(content);
  const preview = `Created blog draft: "${blog.title}"\nSlug: ${blog.slug}\nExcerpt: ${excerpt}\nStructure: ${structure}`;
  const undoEntry = await logAiAction({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    toolName: "create_blog_draft",
    resourceType: "Blog",
    resourceId: blog.id,
    description: preview,
    beforeState: null,
    afterState: blog,
  });

  return { success: true, data: blog, preview, undoEntry };
}

export async function updateBlogDraftTool(
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const blogId = String(args.blogId || "");
  const updates = (args.updates as Record<string, unknown>) || {};
  if (!blogId) return { success: false, error: "blogId required." };

  const before = await db.blog.findUnique({ where: { id: blogId } });
  if (!before) return { success: false, error: "Blog not found." };

  const data: Record<string, unknown> = {};
  for (const key of ["title", "excerpt", "content", "image", "heroImage", "author"]) {
    if (updates[key] !== undefined) data[key] = updates[key];
  }
  if (updates.slug !== undefined) {
    data.slug = normalizeSlug(buildSeoSlug(String(updates.slug), before.title));
  }
  if (updates.content !== undefined) {
    data.content = markdownToBlogHtml(String(updates.content));
  }
  if (updates.excerpt !== undefined || updates.content !== undefined) {
    const nextContent = String(data.content ?? before.content);
    data.excerpt = buildSeoExcerpt(
      updates.excerpt !== undefined ? String(updates.excerpt) : before.excerpt ?? undefined,
      nextContent,
      String(data.title ?? before.title)
    );
  }
  data.status = "DRAFT";

  const updated = await db.blog.update({ where: { id: blogId }, data: data as never });
  const preview = `Updated blog draft "${updated.title}"`;
  const undoEntry = await logAiAction({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    toolName: "update_blog_draft",
    resourceType: "Blog",
    resourceId: blogId,
    description: preview,
    beforeState: before,
    afterState: updated,
  });

  return { success: true, data: updated, preview, undoEntry };
}

export async function createCategoryTool(
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const name = String(args.name || "").trim();
  const slug = normalizeSlug(String(args.slug || name));
  if (!name) return { success: false, error: "name required." };

  const category = await db.category.create({
    data: {
      name,
      slug,
      description: args.description ? String(args.description) : null,
      parentId: args.parentId ? String(args.parentId) : null,
    },
  });

  const preview = `Created category "${category.name}"`;
  const undoEntry = await logAiAction({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    toolName: "create_category",
    resourceType: "Category",
    resourceId: category.id,
    description: preview,
    beforeState: null,
    afterState: category,
  });

  return { success: true, data: category, preview, undoEntry };
}

export async function updateCategoryTool(
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const categoryId = String(args.categoryId || "");
  const updates = (args.updates as Record<string, unknown>) || {};
  if (!categoryId) return { success: false, error: "categoryId required." };

  const before = await db.category.findUnique({ where: { id: categoryId } });
  if (!before) return { success: false, error: "Category not found." };

  const updated = await db.category.update({
    where: { id: categoryId },
    data: updates as never,
  });

  const preview = `Updated category "${before.name}"`;
  const undoEntry = await logAiAction({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    toolName: "update_category",
    resourceType: "Category",
    resourceId: categoryId,
    description: preview,
    beforeState: before,
    afterState: updated,
  });

  return { success: true, data: updated, preview, undoEntry };
}

export async function createNotificationTool(
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const title = String(args.title || "").trim();
  const message = String(args.message || "").trim();
  const userId = args.userId ? String(args.userId) : ctx.userId;
  if (!title || !message) return { success: false, error: "title and message required." };

  const notification = await db.notification.create({
    data: {
      title,
      message,
      userId,
      type: "SYSTEM",
    },
  });

  const preview = `Created notification: ${title}`;
  const undoEntry = await logAiAction({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    toolName: "create_notification",
    resourceType: "Notification",
    resourceId: notification.id,
    description: preview,
    beforeState: null,
    afterState: notification,
  });

  return { success: true, data: notification, preview, undoEntry };
}

export const WRITE_TOOL_HANDLERS: Record<
  string,
  (args: Record<string, unknown>, ctx: AdminAiToolContext) => Promise<AdminAiToolResult>
> = {
  update_product_stock: updateProductStockTool,
  bulk_update_stock: bulkUpdateStockTool,
  add_incoming_stock: executeAddIncomingStock,
  update_product: updateProductTool,
  create_product: createProductTool,
  update_order_status: updateOrderStatusTool,
  update_review_status: updateReviewStatusTool,
  create_coupon: createCouponTool,
  create_blog_draft: createBlogDraftTool,
  update_blog_draft: updateBlogDraftTool,
  create_category: createCategoryTool,
  update_category: updateCategoryTool,
  create_notification: createNotificationTool,
};
