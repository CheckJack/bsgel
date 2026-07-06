"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { subscribeStockAlert, type StockToastEvent } from "@/lib/stock-client";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function StockToastHost({
  onAddAvailable,
}: {
  onAddAvailable?: (productId: string, quantity: number) => void;
}) {
  const { t } = useLanguage();
  const [event, setEvent] = useState<StockToastEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      setEvent((e as CustomEvent<StockToastEvent>).detail);
    };
    window.addEventListener("stock-toast", handler);
    return () => window.removeEventListener("stock-toast", handler);
  }, []);

  if (!event) return null;

  const close = () => setEvent(null);

  const handleNotify = async () => {
    const ok = await subscribeStockAlert(event.productId);
    toast(ok ? t("stock.notifySuccess") : t("stock.notifyError"), ok ? "success" : "error");
    close();
  };

  const handleAddAvailable = () => {
    onAddAvailable?.(event.productId, event.available);
    close();
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-[10000] w-[min(100%,24rem)] -translate-x-1/2 rounded-lg border border-amber-200 bg-white p-4 shadow-xl dark:border-amber-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-brand-black dark:text-white">
          {event.error === "OUT_OF_STOCK"
            ? t("stock.outOfStock")
            : t("stock.insufficientStock").replace("{n}", String(event.available))}
        </p>
        <button type="button" onClick={close} aria-label="Close">
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {event.error === "INSUFFICIENT_STOCK" && event.available > 0 && onAddAvailable && (
          <Button size="sm" variant="default" onClick={handleAddAvailable}>
            {t("stock.addAvailable").replace("{n}", String(event.available))}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleNotify}>
          {t("stock.notifyWhenAvailable")}
        </Button>
      </div>
    </div>
  );
}
