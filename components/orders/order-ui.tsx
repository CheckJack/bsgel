"use client";

import { useLanguage } from "@/contexts/language-context";

export function OrderStatusBadge({
  status,
  awaiting = false,
}: {
  status: string;
  awaiting?: boolean;
}) {
  const { t } = useLanguage();
  const key = status.toLowerCase();
  const label = awaiting
    ? t("orderConfirmation.awaitingPayment")
    : key === "pending"
      ? t("clientPanel.orders.pending")
      : key === "processing"
        ? t("clientPanel.orders.processing")
        : key === "shipped"
          ? t("clientPanel.orders.shipped")
          : key === "delivered"
            ? t("clientPanel.orders.delivered")
            : key === "cancelled"
              ? t("clientPanel.orders.cancelled")
              : status;

  return (
    <span className="inline-flex items-center border border-brand-champagne/35 bg-[#faf9f7] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-brand-champagne">
      {label}
    </span>
  );
}

export function OrderSection({
  title,
  children,
  className = "",
  action,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`border border-[#e8e4de] bg-white ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-[#e8e4de] px-5 py-3.5">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-brand-champagne">
          {title}
        </h2>
        {action}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function OrderAddressField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value?.trim()) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-brand-champagne">
        {label}
      </dt>
      <dd className="mt-1 font-header text-sm text-brand-black">{value}</dd>
    </div>
  );
}
