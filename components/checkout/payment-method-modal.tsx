"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { formatPrice } from "@/lib/utils";
import { getStripe } from "@/lib/stripe-browser";
import { OfflinePaymentPanel } from "@/components/checkout/offline-payment-panel";
import {
  PaymentMethodBrands,
  type CheckoutPaymentChoice,
} from "@/components/checkout/payment-method-brands";
import type { OfflinePaymentDetails } from "@/lib/checkout/offline-payment-instructions";

type Props = {
  open: boolean;
  onClose: () => void;
  paymentChoice: CheckoutPaymentChoice;
  onPaymentChoiceChange: (value: CheckoutPaymentChoice) => void;
  offlineDetails: OfflinePaymentDetails | null;
  expiryDays: number;
  total: number;
  error?: string;
  isProcessing: boolean;
  onConfirm: (stripe: Stripe | null, elements: StripeElements | null) => void;
};

const fieldStyle = {
  base: {
    fontSize: "16px",
    lineHeight: "24px",
    color: "#1a1a1a",
    fontFamily: "Helvetica, Arial, sans-serif",
    "::placeholder": {
      color: "#9ca3af",
    },
  },
  invalid: {
    color: "#9e2146",
  },
};

function StripeField({ children }: { children: React.ReactNode }) {
  return (
    <div className="stripe-card-field h-11 rounded-md border border-gray-200 bg-white px-3 py-2.5">
      {children}
    </div>
  );
}

function PaymentMethodModalInner({
  open,
  onClose,
  paymentChoice,
  onPaymentChoiceChange,
  offlineDetails,
  expiryDays,
  total,
  error,
  isProcessing,
  onConfirm,
  isVisible,
}: Props & { isVisible: boolean }) {
  const { t } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [cardReady, setCardReady] = useState(false);

  useEffect(() => {
    if (open && paymentChoice === "CARD") {
      setCardReady(false);
    }
  }, [open, paymentChoice]);

  const methods = [
    ["CARD", t("checkout.payCard")],
    ["KLARNA", t("checkout.payKlarna")],
    ["MBWAY", t("checkout.payMbway")],
    ["BANK", t("checkout.payBank")],
  ] as const;

  const needsStripe = paymentChoice === "CARD" || paymentChoice === "KLARNA";
  const stripeReady = Boolean(stripe);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t("common.close")}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={isProcessing ? undefined : onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-payment-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black disabled:opacity-50"
          aria-label={t("common.close")}
        >
          <X className="h-4 w-4" />
        </button>

        <h2
          id="checkout-payment-title"
          className="pr-8 font-display text-xl font-normal tracking-tight text-brand-black"
        >
          {t("checkout.paymentMethod")}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{t("checkout.choosePaymentMethod")}</p>

        <div className="mt-5 grid gap-2">
          {methods.map(([value, label]) => (
            <div key={value} className="space-y-2">
              <label
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-sm border p-3 ${
                  paymentChoice === value
                    ? "border-brand-champagne bg-[#faf9f7]"
                    : "border-gray-200"
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <input
                    type="radio"
                    name="paymentChoice"
                    className="mt-1 shrink-0"
                    checked={paymentChoice === value}
                    onChange={() => onPaymentChoiceChange(value)}
                    disabled={isProcessing}
                  />
                  <span className="text-sm leading-snug sm:text-base">{label}</span>
                </div>
                <PaymentMethodBrands method={value} />
              </label>

              {paymentChoice === "CARD" && value === "CARD" && (
                <div className="space-y-3 rounded-md border border-gray-200 bg-white p-3 sm:p-4">
                  {!stripeReady ? (
                    <p className="text-sm text-muted-foreground">{t("checkout.cardLoading")}</p>
                  ) : (
                    <>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600">
                          {t("checkout.cardNumber")}
                        </label>
                        <StripeField>
                          <CardNumberElement
                            options={{
                              showIcon: true,
                              placeholder: "ACCT-000015",
                              style: fieldStyle,
                            }}
                            onReady={() => setCardReady(true)}
                          />
                        </StripeField>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600">
                            {t("checkout.cardExpiry")}
                          </label>
                          <StripeField>
                            <CardExpiryElement
                              options={{
                                placeholder: "MM / AA",
                                style: fieldStyle,
                              }}
                            />
                          </StripeField>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600">
                            {t("checkout.cardCvc")}
                          </label>
                          <StripeField>
                            <CardCvcElement
                              options={{
                                placeholder: "CVC",
                                style: fieldStyle,
                              }}
                            />
                          </StripeField>
                        </div>
                      </div>
                      {!cardReady && (
                        <p className="text-xs text-muted-foreground">{t("checkout.cardLoading")}</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {paymentChoice === "KLARNA" && value === "KLARNA" && (
                <p className="px-1 text-sm text-muted-foreground">{t("checkout.klarnaHint")}</p>
              )}

              {paymentChoice === value &&
                (value === "MBWAY" || value === "BANK") &&
                offlineDetails && (
                  <OfflinePaymentPanel
                    method={value}
                    details={offlineDetails}
                    expiryDays={expiryDays}
                  />
                )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <Button
          type="button"
          className="mt-5 w-full"
          size="lg"
          disabled={isProcessing || (needsStripe && !stripeReady)}
          onClick={() => onConfirm(stripe, elements)}
        >
          {isProcessing
            ? t("checkout.processing")
            : `${t("checkout.placeOrder")} ${formatPrice(total)}`}
        </Button>
      </div>
    </div>
  );
}

export function PaymentMethodModal(props: Props) {
  const { open, isProcessing, onClose } = props;
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
    const timer = window.setTimeout(() => setShouldRender(false), 200);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open || isProcessing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isProcessing, onClose]);

  if (!shouldRender || typeof document === "undefined") return null;

  return createPortal(
    <Elements stripe={getStripe()} options={{ locale: "pt" }}>
      <PaymentMethodModalInner {...props} isVisible={isVisible} />
    </Elements>,
    document.body
  );
}
