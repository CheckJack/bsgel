import { toast } from "@/components/ui/toast";

export type StockToastEvent = {
  error: "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";
  productId: string;
  available: number;
};

export function dispatchStockToast(detail: StockToastEvent) {
  window.dispatchEvent(new CustomEvent("stock-toast", { detail }));
}

type StockErrorBody = {
  error: "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";
  available?: number;
  productId?: string;
  partial?: boolean;
};

export async function subscribeStockAlert(productId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/stock-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function parseCartStockResponse(
  res: Response,
  partialAddedLabel: string
): Promise<"ok" | "partial" | "blocked"> {
  if (res.ok) return "ok";
  if (res.status !== 409) return "blocked";
  try {
    const body = (await res.json()) as StockErrorBody;
    if (body.error === "OUT_OF_STOCK" || body.error === "INSUFFICIENT_STOCK") {
      if (body.partial && body.available != null) {
        toast(partialAddedLabel.replace("{n}", String(body.available)), "warning", 6000);
        return "partial";
      }
      if (body.productId) {
        dispatchStockToast({
          error: body.error,
          productId: body.productId,
          available: body.available ?? 0,
        });
      }
    }
  } catch {
    /* ignore */
  }
  return "blocked";
}
