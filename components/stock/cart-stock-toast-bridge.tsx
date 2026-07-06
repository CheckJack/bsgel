"use client";

import { useCart } from "@/contexts/cart-context";
import { StockToastHost } from "@/components/stock/stock-toast-host";

export function CartStockToastBridge() {
  const { items, addItem, updateQuantity, refreshCart } = useCart();

  return (
    <StockToastHost
      onAddAvailable={async (productId, available) => {
        const existing = items.find((i) => i.product.id === productId);
        if (existing) {
          await updateQuantity(existing.id, available);
        } else {
          await addItem(productId, available);
        }
        await refreshCart();
      }}
    />
  );
}
