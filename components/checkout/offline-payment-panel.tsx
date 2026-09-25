"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { OfflinePaymentDetails } from "@/lib/checkout/offline-payment-instructions";

type Props = {
  method: "MBWAY" | "BANK";
  details: OfflinePaymentDetails;
  expiryDays?: number;
  orderRef?: string;
};

const detailRowClass =
  "grid grid-cols-[7rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-[#eee8e0] px-3 py-1.5 last:border-b-0";
const detailLabelClass =
  "text-[10px] font-medium uppercase tracking-[0.16em] text-brand-champagne";
const detailValueClass = "min-w-0 truncate text-sm leading-snug text-brand-black/80";

function CopyValue({ label, value }: { label: string; value: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={detailRowClass}>
      <p className={detailLabelClass}>{label}</p>
      <p className={detailValueClass}>{value}</p>
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-brand-champagne transition-colors hover:text-brand-black"
        aria-label={t("checkout.offlineCopyValue")}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? t("checkout.offlineCopied") : t("checkout.offlineCopy")}
      </button>
    </div>
  );
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return (
    <div className={detailRowClass}>
      <p className={detailLabelClass}>{label}</p>
      <p className={detailValueClass}>{value}</p>
    </div>
  );
}

export function OfflinePaymentPanel({
  method,
  details,
  orderRef,
}: Props) {
  const { t } = useLanguage();
  const isMbway = method === "MBWAY";
  const steps = isMbway
    ? [
        t("checkout.offlineMbwayStep1"),
        t("checkout.offlineMbwayStep2"),
        orderRef
          ? t("checkout.offlineStepWithRef", { ref: orderRef })
          : t("checkout.offlineMbwayStep3"),
      ]
    : [
        t("checkout.offlineBankStep1"),
        orderRef
          ? t("checkout.offlineStepWithRef", { ref: orderRef })
          : t("checkout.offlineBankStep2"),
        t("checkout.offlineBankStep3"),
      ];

  return (
    <div className="overflow-hidden rounded-sm border border-[#e8e4de] bg-[#faf9f7]">
      <div className="px-3 py-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-champagne">
          {isMbway ? t("checkout.payMbway") : t("checkout.payBank")}
        </p>

        <div className="mb-3 border border-[#e8e4de] bg-white">
          {isMbway ? (
            <CopyValue label={t("checkout.offlinePhoneLabel")} value={details.mbwayPhone} />
          ) : (
            <>
              <CopyValue
                label={t("checkout.offlineBeneficiary")}
                value={details.bankAccountName}
              />
              {details.bankName ? (
                <CopyValue label={t("checkout.offlineBank")} value={details.bankName} />
              ) : null}
              {details.bankIban ? (
                <CopyValue label={t("checkout.offlineIban")} value={details.bankIban} />
              ) : (
                <DetailValue
                  label={t("checkout.offlineIban")}
                  value={t("checkout.offlineIbanSoon")}
                />
              )}
              {details.bankBic ? (
                <CopyValue label={t("checkout.offlineBic")} value={details.bankBic} />
              ) : null}
            </>
          )}
        </div>

        <ol className="space-y-1.5">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-2 text-sm leading-snug text-brand-black/80">
              <span className="mt-0.5 w-5 shrink-0 text-[11px] tracking-[0.08em] text-brand-champagne">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-2.5 text-xs leading-snug text-brand-black/45">
          {t("checkout.offlineConfirmNote")}
        </p>
      </div>
    </div>
  );
}
