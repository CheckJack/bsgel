import { db } from "@/lib/db";
import { updateProductStock, bulkUpdateProductStock } from "@/lib/stock";
import { logAiAction } from "@/lib/admin-ai/logger";
import type { AdminAiToolContext, AdminAiToolResult } from "@/lib/admin-ai/tools/types";

export async function undoAiAction(
  undoId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const entry = await db.adminAiUndoEntry.findFirst({
    where: { id: undoId, userId, undoneAt: null },
  });

  if (!entry) {
    return { success: false, message: "Undo entry not found or already reverted." };
  }

  if (entry.expiresAt < new Date()) {
    return { success: false, message: "Undo window expired (1 hour limit)." };
  }

  const before = entry.beforeState as Record<string, unknown>;

  try {
    switch (entry.toolName) {
      case "update_product_stock": {
        const productId = entry.resourceId!;
        const prevQty = Number(before.stockQuantity);
        await updateProductStock(productId, prevQty);
        break;
      }
      case "add_incoming_stock": {
        const items = (before.items as { productId: string; stockQuantity: number }[]) || [];
        for (const item of items) {
          await updateProductStock(item.productId, item.stockQuantity);
        }
        break;
      }
      case "bulk_update_stock": {
        const items = (before.items as { productId: string; stockQuantity: number }[]) || [];
        const CHUNK = 50;
        for (let i = 0; i < items.length; i += CHUNK) {
          await Promise.all(
            items.slice(i, i + CHUNK).map((item) => updateProductStock(item.productId, item.stockQuantity))
          );
        }
        break;
      }
      case "update_product": {
        const { id, ...data } = before as { id: string } & Record<string, unknown>;
        await db.product.update({ where: { id }, data: data as never });
        break;
      }
      case "create_product": {
        if (entry.resourceId) {
          await db.product.delete({ where: { id: entry.resourceId } });
        }
        break;
      }
      case "update_order_status": {
        await db.order.update({
          where: { id: entry.resourceId! },
          data: { status: before.status as never },
        });
        break;
      }
      case "update_review_status": {
        await db.productReview.update({
          where: { id: entry.resourceId! },
          data: { status: before.status as never },
        });
        break;
      }
      case "create_coupon": {
        if (entry.resourceId) {
          await db.coupon.delete({ where: { id: entry.resourceId } });
        }
        break;
      }
      case "create_blog_draft": {
        if (entry.resourceId) {
          await db.blog.delete({ where: { id: entry.resourceId } });
        }
        break;
      }
      case "update_blog_draft": {
        const { id, ...data } = before as { id: string } & Record<string, unknown>;
        await db.blog.update({ where: { id }, data: data as never });
        break;
      }
      case "create_category":
      case "update_category": {
        if (entry.toolName === "create_category" && entry.resourceId) {
          await db.category.delete({ where: { id: entry.resourceId } });
        } else if (entry.toolName === "update_category") {
          const { id, ...data } = before as { id: string } & Record<string, unknown>;
          await db.category.update({ where: { id }, data: data as never });
        }
        break;
      }
      case "create_notification": {
        if (entry.resourceId) {
          await db.notification.delete({ where: { id: entry.resourceId } });
        }
        break;
      }
      default:
        return { success: false, message: `Undo not supported for ${entry.toolName}.` };
    }

    await db.adminAiUndoEntry.update({
      where: { id: undoId },
      data: { undoneAt: new Date() },
    });

    return { success: true, message: `Reverted: ${entry.description}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Undo failed";
    return { success: false, message: msg };
  }
}

export async function listUndoableActions(
  userId: string,
  conversationId?: string
) {
  const entries = await db.adminAiUndoEntry.findMany({
    where: {
      userId,
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
      resourceType: true,
      expiresAt: true,
      createdAt: true,
    },
  });
  return entries;
}

export async function executeAddIncomingStock(
  args: Record<string, unknown>,
  ctx: AdminAiToolContext
): Promise<AdminAiToolResult> {
  const items = (args.items as { productId?: string; productName?: string; incomingQuantity: number }[]) || [];
  if (!items.length) {
    return { success: false, error: "No items provided." };
  }

  const updates: { productId: string; name: string; before: number; after: number }[] = [];

  for (const item of items) {
    const incoming = Number(item.incomingQuantity);
    if (!Number.isInteger(incoming) || incoming < 0) {
      return { success: false, error: "Invalid incoming quantity." };
    }

    let product = null;
    if (item.productId) {
      product = await db.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, stockQuantity: true },
      });
    } else if (item.productName) {
      product = await db.product.findFirst({
        where: { name: { contains: item.productName, mode: "insensitive" } },
        select: { id: true, name: true, stockQuantity: true },
      });
    }

    if (!product) {
      return { success: false, error: `Product not found: ${item.productId || item.productName}` };
    }

    const newQty = product.stockQuantity + incoming;
    const before = product.stockQuantity;
    await updateProductStock(product.id, newQty);
    updates.push({ productId: product.id, name: product.name, before, after: newQty });
  }

  const preview = updates
    .map((u) => `${u.name}: ${u.before} → ${u.after}`)
    .join("\n");

  const undoEntry = await logAiAction({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    toolName: "add_incoming_stock",
    resourceType: "Product",
    description: `Added incoming stock for ${updates.length} product(s)`,
    beforeState: {
      items: updates.map((u) => ({ productId: u.productId, stockQuantity: u.before })),
    },
    afterState: { items: updates },
  });

  return { success: true, data: { updates }, preview, undoEntry };
}
