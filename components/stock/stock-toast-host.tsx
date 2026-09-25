"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { subscribeStockAlert, type StockToastEvent } from "@/lib/stock-client";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function StockToastHost({
  onAddAvailable,
}: {
  onAddAvailable?: (productId: string, quantity: number) => void;
}) {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [event, setEvent] = useState<StockToastEvent | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      setEvent((e as CustomEvent<StockToastEvent>).detail);
      setIsSubscribing(false);
    };
    window.addEventListener("stock-toast", handler);
    return () => window.removeEventListener("stock-toast", handler);
  }, []);

  if (!event) return null;

  const close = () => {
    if (isSubscribing) return;
    setEvent(null);
  };

  const handleYes = async () => {
    if (!session?.user) {
      const callback = pathname || "/";
      setEvent(null);
      router.push(`/login?callbackUrl=${encodeURIComponent(callback)}`);
      return;
    }

    setIsSubscribing(true);
    try {
      const ok = await subscribeStockAlert(event.productId);
      toast(ok ? t("stock.notifySuccess") : t("stock.notifyError"), ok ? "success" : "error");
      setEvent(null);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleNo = () => {
    close();
  };

  const handleAddAvailable = () => {
    onAddAvailable?.(event.productId, event.available);
    close();
  };

  const stockMessage =
    event.error === "OUT_OF_STOCK"
      ? t("stock.outOfStock")
      : t("stock.insufficientStock").replace("{n}", String(event.available));

  return (
    <div className="fixed bottom-6 right-4 z-[10000] max-sm:bottom-4 max-sm:left-4 max-sm:right-4">
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="relative flex min-w-[300px] max-w-[420px] items-start gap-3 overflow-hidden rounded-none border border-brand-champagne/30 bg-brand-white p-4 text-brand-black shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
      >
        <div className="mt-0.5 flex-shrink-0" aria-hidden="true">
          <AlertCircle className="h-5 w-5 text-brand-champagne-dark" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-header text-sm font-medium leading-relaxed text-brand-black/85">
            {stockMessage}
          </p>
          <p className="mt-2 font-header text-sm font-normal leading-relaxed text-brand-black/70">
            {t("stock.notifyQuestion")}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {event.error === "INSUFFICIENT_STOCK" && event.available > 0 && onAddAvailable ? (
              <Button size="sm" variant="default" onClick={handleAddAvailable} disabled={isSubscribing}>
                {t("stock.addAvailable").replace("{n}", String(event.available))}
              </Button>
            ) : null}
            <Button
              size="sm"
              className="bg-brand-black text-white hover:bg-brand-black/90"
              onClick={handleYes}
              disabled={isSubscribing}
            >
              {isSubscribing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : null}
              {t("stock.notifyYes")}
            </Button>
            <Button size="sm" variant="outline" onClick={handleNo} disabled={isSubscribing}>
              {t("stock.notifyNo")}
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={close}
          disabled={isSubscribing}
          className="flex-shrink-0 text-brand-black/40 transition-colors hover:text-brand-black disabled:opacity-50"
          aria-label={t("toasts.closeNotification")}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
