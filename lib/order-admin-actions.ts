import { isManualPaymentAwaiting, type OrderStatusDisplayInput } from "@/lib/order-status-display";

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type OrderAdminAction =
  | { type: "confirm_payment" }
  | { type: "cancel_order" }
  | { type: "set_status"; status: OrderStatus; labelKey: string; variant?: "primary" | "outline" };

type OrderForActions = OrderStatusDisplayInput & {
  status: OrderStatus;
  items?: unknown[];
  trainingItems?: unknown[];
};

export function getOrderAdminActions(order: OrderForActions): OrderAdminAction[] {
  if (isManualPaymentAwaiting(order)) {
    return [{ type: "confirm_payment" }, { type: "cancel_order" }];
  }

  const hasProducts = (order.items?.length ?? 0) > 0;
  const hasTraining = (order.trainingItems?.length ?? 0) > 0;

  switch (order.status) {
    case "PROCESSING": {
      const actions: OrderAdminAction[] = [];
      if (hasProducts) {
        actions.push({
          type: "set_status",
          status: "SHIPPED",
          labelKey: "orders.shipOrder",
          variant: "primary",
        });
      }
      if (hasTraining || !hasProducts) {
        actions.push({
          type: "set_status",
          status: "DELIVERED",
          labelKey: hasProducts ? "orders.markDelivered" : "orders.completeOrder",
          variant: hasProducts ? "outline" : "primary",
        });
      }
      return actions;
    }
    case "SHIPPED":
      return [
        {
          type: "set_status",
          status: "DELIVERED",
          labelKey: "orders.markDelivered",
          variant: "primary",
        },
      ];
    default:
      return [];
  }
}
