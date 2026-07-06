import { db } from "@/lib/db";
import { validateQuantity } from "@/lib/stock";

export type CartStockErrorBody = {
  error: "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";
  message: string;
  available: number;
  requested?: number;
  productId: string;
};

export async function resolveCartQuantity(
  productId: string,
  requestedQty: number,
  existingQty = 0
): Promise<
  | { ok: true; quantity: number }
  | { ok: false; body: CartStockErrorBody }
> {
  const totalRequested = existingQty + requestedQty;
  const check = await validateQuantity(productId, totalRequested);

  if (check.ok) {
    return { ok: true, quantity: totalRequested };
  }

  if (check.code === "OUT_OF_STOCK") {
    return {
      ok: false,
      body: {
        error: "OUT_OF_STOCK",
        message: "This product is out of stock",
        available: 0,
        requested: totalRequested,
        productId,
      },
    };
  }

  const availableForNew = Math.max(0, check.available - existingQty);
  if (availableForNew <= 0 && existingQty > 0) {
    return {
      ok: false,
      body: {
        error: "INSUFFICIENT_STOCK",
        message: "Not enough stock available",
        available: check.available,
        requested: totalRequested,
        productId,
      },
    };
  }

  if (availableForNew > 0 && availableForNew < requestedQty) {
    return {
      ok: false,
      body: {
        error: "INSUFFICIENT_STOCK",
        message: "Not enough stock available",
        available: check.available,
        requested: totalRequested,
        productId,
      },
      // partial: caller can use availableForNew
    } as { ok: false; body: CartStockErrorBody };
  }

  return {
    ok: false,
    body: {
      error: "INSUFFICIENT_STOCK",
      message: "Not enough stock available",
      available: check.available,
      requested: totalRequested,
      productId,
    },
  };
}

export async function upsertCartItem(
  userId: string,
  productId: string,
  quantity: number
) {
  let cart = await db.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await db.cart.create({ data: { userId } });
  }

  const existingItem = await db.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existingItem) {
    await db.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity },
    });
  } else {
    await db.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }
}
