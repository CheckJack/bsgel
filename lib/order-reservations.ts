import { db } from "@/lib/db";
import { restoreOrderStockIfNeeded } from "@/lib/stock";
import { cancelOrderTrainingBookings } from "@/lib/cart-training";

/**
 * Undo inventory hold + training seats for a cancelled/expired order.
 * Safe to call multiple times (stock restore is idempotent via stockRestoredAt).
 */
export async function releaseOrderReservations(
  orderId: string,
  options?: { previousStatus?: string }
) {
  await restoreOrderStockIfNeeded(orderId, {
    previousStatus: options?.previousStatus,
  });

  const trainingItems = await db.orderTrainingItem.findMany({
    where: { orderId },
    select: { bookingId: true },
  });

  await cancelOrderTrainingBookings(trainingItems);
}
