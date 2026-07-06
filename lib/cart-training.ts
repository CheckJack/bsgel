import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const cartWithTrainingInclude = {
  items: {
    include: {
      product: {
        include: { category: true },
      },
    },
  },
  trainingItems: {
    include: {
      session: {
        include: { program: true },
      },
      booking: true,
    },
  },
} satisfies Prisma.CartInclude;

export type CartWithTraining = Prisma.CartGetPayload<{
  include: typeof cartWithTrainingInclude;
}>;

export function decimalToString(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) return "0";
  return typeof value === "object" && value !== null ? value.toString() : String(value);
}

export function serializeTrainingCartItem(
  item: CartWithTraining["trainingItems"][number]
) {
  const program = item.session.program;
  return {
    id: item.id,
    sessionId: item.sessionId,
    bookingId: item.bookingId,
    program: {
      id: program.id,
      title: program.title,
      price: decimalToString(program.price),
      image: program.image,
    },
    session: {
      id: item.session.id,
      startDate: item.session.startDate.toISOString(),
      endDate: item.session.endDate.toISOString(),
      location: item.session.location,
      format: item.session.format,
    },
  };
}

export function getProductSubtotal(cart: CartWithTraining) {
  return cart.items.reduce((sum, item) => {
    return sum + Number(item.product.price) * item.quantity;
  }, 0);
}

export function getTrainingSubtotal(cart: CartWithTraining) {
  return cart.trainingItems.reduce((sum, item) => {
    return sum + Number(item.session.program.price);
  }, 0);
}

export function getCartSubtotal(cart: CartWithTraining) {
  return getProductSubtotal(cart) + getTrainingSubtotal(cart);
}

export function isCartEmpty(cart: CartWithTraining) {
  return cart.items.length === 0 && cart.trainingItems.length === 0;
}

export async function clearUserCart(cartId: string) {
  await db.$transaction([
    db.cartItem.deleteMany({ where: { cartId } }),
    db.cartTrainingItem.deleteMany({ where: { cartId } }),
  ]);
}

export async function confirmTrainingBookings(
  trainingItems: Array<{ bookingId: string | null }>
) {
  const bookingIds = trainingItems
    .map((item) => item.bookingId)
    .filter((id): id is string => Boolean(id));

  if (bookingIds.length === 0) return;

  await db.trainingBooking.updateMany({
    where: {
      id: { in: bookingIds },
      status: "PENDING",
    },
    data: { status: "CONFIRMED" },
  });
}

export async function cancelPendingBooking(bookingId: string | null | undefined) {
  if (!bookingId) return;

  await db.trainingBooking.updateMany({
    where: { id: bookingId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}
