import { toast } from "@/components/ui/toast";
import { translate } from "@/lib/i18n";
import type { PurchaseAccessCode } from "@/lib/certifications";

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

export type PurchaseDeniedBody = {
  error?: string;
  code?: PurchaseAccessCode | string;
  categoryName?: string;
  certificationName?: string;
};

export type CartAddResult =
  | "ok"
  | "partial"
  | "forbidden"
  | "out_of_stock"
  | "insufficient"
  | "blocked";

type TranslateFn = (key: string, params?: Record<string, string>) => string;

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

/** Show a brand-styled toast explaining why a product cannot be purchased. */
export function showPurchaseDeniedToast(
  body: PurchaseDeniedBody,
  t: TranslateFn
) {
  const category = body.categoryName?.trim() || t("cart.purchaseDenied.thisCategory");
  const certification =
    body.certificationName?.trim() || t("cart.purchaseDenied.yourCertification");

  if (body.code === "CERTIFICATION_INSUFFICIENT") {
    toast(
      t("cart.purchaseDenied.insufficientBody", { certification, category }),
      "notice",
      10000,
      t("cart.purchaseDenied.insufficientTitle")
    );
    return;
  }

  toast(
    t("cart.purchaseDenied.requiredBody", { category }),
    "notice",
    10000,
    t("cart.purchaseDenied.requiredTitle")
  );
}

export async function parseCartStockResponse(
  res: Response,
  partialAddedLabel: string,
  t?: TranslateFn
): Promise<CartAddResult> {
  if (res.ok) return "ok";

  if (res.status === 403) {
    try {
      const body = (await res.json()) as PurchaseDeniedBody;
      showPurchaseDeniedToast(body, t || translate);
    } catch {
      showPurchaseDeniedToast({ code: "CERTIFICATION_REQUIRED" }, t || translate);
    }
    return "forbidden";
  }

  if (res.status !== 409) return "blocked";

  const tr = t || translate;
  try {
    const body = (await res.json()) as StockErrorBody;
    if (body.error === "OUT_OF_STOCK") {
      if (body.productId) {
        dispatchStockToast({
          error: "OUT_OF_STOCK",
          productId: body.productId,
          available: 0,
        });
      } else {
        toast(tr("stock.outOfStock"), "error");
      }
      return "out_of_stock";
    }
    if (body.error === "INSUFFICIENT_STOCK") {
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
      } else {
        toast(
          tr("stock.insufficientStock").replace("{n}", String(body.available ?? 0)),
          "error"
        );
      }
      return "insufficient";
    }
  } catch {
    /* ignore */
  }
  toast(tr("stock.outOfStock"), "error");
  return "out_of_stock";
}
