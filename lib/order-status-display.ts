export type OrderStatusDisplayInput = {
  status: string;
  shopPaymentMethod?: string | null;
  paymentIntentId?: string | null;
  manualPaymentStatus?: string | null;
};

export function isManualPaymentAwaiting(order: OrderStatusDisplayInput): boolean {
  return (
    (order.shopPaymentMethod === "MBWAY" || order.shopPaymentMethod === "BANK_TRANSFER") &&
    order.status === "PENDING" &&
    (order.manualPaymentStatus === "PENDING" || order.manualPaymentStatus == null)
  );
}

export function isStripePaidOrder(order: OrderStatusDisplayInput): boolean {
  return (
    order.shopPaymentMethod === "STRIPE_CARD" ||
    order.shopPaymentMethod === "STRIPE_KLARNA" ||
    Boolean(order.paymentIntentId)
  );
}

/** Stripe-paid orders should never present as awaiting payment. */
export function getEffectiveOrderStatus(order: OrderStatusDisplayInput): string {
  if (order.status === "PENDING" && isStripePaidOrder(order)) {
    return "PROCESSING";
  }
  return order.status;
}
