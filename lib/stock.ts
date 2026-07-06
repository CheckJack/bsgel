import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";
import {
  sendCustomerBackInStockEmail,
  sendAdminLowStockEmail,
} from "@/lib/email/stock-alerts";

export type StockValidationCode = "OK" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";

export type StockValidationResult = {
  ok: boolean;
  code: StockValidationCode;
  available: number;
  requested?: number;
  productId: string;
};

export function syncOutOfStock(stockQuantity: number): boolean {
  return stockQuantity <= 0;
}

export async function getProductStock(productId: string): Promise<{
  stockQuantity: number;
  outOfStock: boolean;
} | null> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { stockQuantity: true, outOfStock: true },
  });
  if (!product) return null;
  return {
    stockQuantity: product.stockQuantity,
    outOfStock: product.outOfStock,
  };
}

export async function validateQuantity(
  productId: string,
  requestedQty: number
): Promise<StockValidationResult> {
  const stock = await getProductStock(productId);
  if (!stock) {
    return { ok: false, code: "OUT_OF_STOCK", available: 0, requested: requestedQty, productId };
  }
  if (stock.stockQuantity <= 0) {
    return {
      ok: false,
      code: "OUT_OF_STOCK",
      available: 0,
      requested: requestedQty,
      productId,
    };
  }
  if (requestedQty > stock.stockQuantity) {
    return {
      ok: false,
      code: "INSUFFICIENT_STOCK",
      available: stock.stockQuantity,
      requested: requestedQty,
      productId,
    };
  }
  return {
    ok: true,
    code: "OK",
    available: stock.stockQuantity,
    requested: requestedQty,
    productId,
  };
}

const LOW_STOCK_THRESHOLD = 2;
const LOW_STOCK_NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

async function notifyAdminsLowStock(productId: string, productName: string, stockQuantity: number) {
  const admins = await db.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true, email: true, name: true },
  });

  const since = new Date(Date.now() - LOW_STOCK_NOTIFY_COOLDOWN_MS);
  const recent = await db.notification.findFirst({
    where: {
      type: NotificationType.STOCK_LOW,
      createdAt: { gte: since },
      message: { contains: productName },
    },
  });
  if (recent) return;

  const title = "Low stock alert";
  const message = `${productName} has only ${stockQuantity} unit${stockQuantity === 1 ? "" : "s"} left.`;

  await Promise.all(
    admins.map(async (admin) => {
      await db.notification.create({
        data: {
          type: NotificationType.STOCK_LOW,
          title,
          message,
          userId: admin.id,
          linkUrl: `/admin/stock?urgent=true`,
          metadata: { productId, stockQuantity },
        },
      });
      await sendAdminLowStockEmail({
        to: admin.email,
        adminName: admin.name,
        productName,
        stockQuantity,
        productId,
      });
    })
  );
}

async function notifyCustomersBackInStock(productId: string, productName: string) {
  const alerts = await db.stockBackInStockAlert.findMany({
    where: { productId, notifiedAt: null },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (alerts.length === 0) return;

  const now = new Date();
  await db.stockBackInStockAlert.updateMany({
    where: { productId, notifiedAt: null },
    data: { notifiedAt: now },
  });

  await Promise.all(
    alerts.map(async (alert) => {
      await db.notification.create({
        data: {
          type: NotificationType.STOCK_BACK_IN_STOCK,
          title: "Back in stock",
          message: `${productName} is available again.`,
          userId: alert.userId,
          linkUrl: `/products/${productId}`,
          metadata: { productId },
        },
      });
      await sendCustomerBackInStockEmail({
        to: alert.user.email,
        customerName: alert.user.name,
        productName,
        productId,
      });
    })
  );
}

export async function processStockSideEffects(
  productId: string,
  productName: string,
  oldQty: number,
  newQty: number
) {
  if (oldQty <= 0 && newQty > 0) {
    await notifyCustomersBackInStock(productId, productName);
  }
  if (newQty >= 1 && newQty <= LOW_STOCK_THRESHOLD) {
    await notifyAdminsLowStock(productId, productName, newQty);
  }
}

export async function updateProductStock(
  productId: string,
  stockQuantity: number
): Promise<{ stockQuantity: number; outOfStock: boolean } | null> {
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    throw new Error("Stock quantity must be a non-negative integer");
  }

  const existing = await db.product.findUnique({
    where: { id: productId },
    select: { stockQuantity: true, name: true },
  });
  if (!existing) return null;

  const outOfStock = syncOutOfStock(stockQuantity);
  const updated = await db.product.update({
    where: { id: productId },
    data: { stockQuantity, outOfStock },
    select: { stockQuantity: true, outOfStock: true },
  });

  await processStockSideEffects(
    productId,
    existing.name,
    existing.stockQuantity,
    stockQuantity
  );

  return updated;
}

export async function bulkUpdateProductStock(
  productIds: string[],
  stockQuantity: number
): Promise<number> {
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    throw new Error("Stock quantity must be a non-negative integer");
  }

  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, stockQuantity: true },
  });

  const outOfStock = syncOutOfStock(stockQuantity);
  await db.product.updateMany({
    where: { id: { in: productIds } },
    data: { stockQuantity, outOfStock },
  });

  await Promise.all(
    products.map((p) =>
      processStockSideEffects(p.id, p.name, p.stockQuantity, stockQuantity)
    )
  );

  return products.length;
}

export async function decrementStockForOrder(
  items: { productId: string; quantity: number }[]
) {
  await db.$transaction(async (tx) => {
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stockQuantity: true, name: true },
      });
      if (!product) continue;

      const newQty = Math.max(0, product.stockQuantity - item.quantity);
      const outOfStock = syncOutOfStock(newQty);
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: newQty, outOfStock },
      });

      if (newQty >= 1 && newQty <= LOW_STOCK_THRESHOLD) {
        await notifyAdminsLowStock(item.productId, product.name, newQty);
      }
    }
  });
}

export async function clampCartItemsToStock(userId: string) {
  const cart = await db.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: { select: { stockQuantity: true, outOfStock: true } } },
      },
    },
  });
  if (!cart) return;

  for (const item of cart.items) {
    const available = item.product.stockQuantity;
    if (available <= 0) {
      await db.cartItem.delete({ where: { id: item.id } });
    } else if (item.quantity > available) {
      await db.cartItem.update({
        where: { id: item.id },
        data: { quantity: available },
      });
    }
  }
}

export async function validateCartStock(userId: string): Promise<StockValidationResult | null> {
  const cart = await db.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: { select: { id: true, stockQuantity: true } } },
      },
    },
  });
  if (!cart) return null;

  for (const item of cart.items) {
    const result = await validateQuantity(item.productId, item.quantity);
    if (!result.ok) return result;
  }
  return null;
}
