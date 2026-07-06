"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { formatPrice } from "@/lib/utils";

type TrainingSessionChoiceModalProps = {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void | Promise<void>;
  onContinueShopping: () => void | Promise<void>;
  isSubmitting?: boolean;
  programTitle: string;
  price: number;
  startLabel: string;
  endLabel: string;
  location?: string | null;
};

export function TrainingSessionChoiceModal({
  open,
  onClose,
  onCheckout,
  onContinueShopping,
  isSubmitting = false,
  programTitle,
  price,
  startLabel,
  endLabel,
  location,
}: TrainingSessionChoiceModalProps) {
  const { t } = useLanguage();
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
      return;
    }

    setIsVisible(false);
    const timer = window.setTimeout(() => setShouldRender(false), 300);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t("training.cancel")}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={isSubmitting ? undefined : onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="training-session-choice-title"
        className={`relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl transition-all duration-300 ${
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black disabled:opacity-50"
          aria-label={t("training.cancel")}
        >
          <X className="h-4 w-4" />
        </button>

        <h2
          id="training-session-choice-title"
          className="pr-8 font-display text-xl font-normal tracking-tight text-brand-black"
        >
          {t("training.sessionChoiceTitle")}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{t("training.sessionChoiceDesc")}</p>

        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-brand-black">{programTitle}</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
            <Clock className="h-4 w-4 shrink-0 text-brand-champagne" aria-hidden />
            <span>
              {startLabel} – {endLabel}
            </span>
          </div>
          {location ? (
            <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 shrink-0 text-brand-champagne" aria-hidden />
              <span>{location}</span>
            </div>
          ) : null}
          <p className="mt-3 text-base font-semibold text-brand-black">{formatPrice(String(price))}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
            onClick={onContinueShopping}
          >
            {isSubmitting ? t("training.booking") : t("training.continueShopping")}
          </Button>
          <Button type="button" className="flex-1 bg-brand-black hover:bg-brand-black/90" disabled={isSubmitting} onClick={onCheckout}>
            {isSubmitting ? t("training.booking") : t("training.checkoutNow")}
          </Button>
        </div>
      </div>
    </div>
  );
}
