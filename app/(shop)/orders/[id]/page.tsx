"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { parseOrderShippingAddress } from "@/lib/parse-order-shipping-address";
import {
  getEffectiveOrderStatus,
  isManualPaymentAwaiting,
} from "@/lib/order-status-display";
import { OfflinePaymentPanel } from "@/components/checkout/offline-payment-panel";
import type { OfflinePaymentDetails } from "@/lib/checkout/offline-payment-instructions";
import { toast } from "@/components/ui/toast";

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  product: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface OrderTrainingItem {
  id: string;
  quantity: number;
  price: string;
  program: {
    id: string;
    title: string;
    image: string | null;
  };
  session: {
    id: string;
    startDate: string;
    endDate: string | null;
    location: string | null;
  };
}

interface Order {
  id: string;
  total: string;
  status: string;
  shippingAddress: string | null;
  billingNif: string | null;
  billingAddress: string | null;
  shopPaymentMethod?: string | null;
  manualPaymentStatus?: string | null;
  paymentIntentId?: string | null;
  shippingAmount?: string | null;
  taxRate: number | null;
  taxAmount: string | null;
  taxRegion: string | null;
  createdAt: string;
  items: OrderItem[];
  trainingItems?: OrderTrainingItem[];
}

function AddressField({ label, value }: { label: string; value?: string | null }) {
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

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-[#e8e4de] bg-white ${className}`}>
      <div className="border-b border-[#e8e4de] px-5 py-3.5">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-brand-champagne">
          {title}
        </h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { t, language } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [offlineDetails, setOfflineDetails] = useState<OfflinePaymentDetails | null>(null);
  const [offlineExpiryDays, setOfflineExpiryDays] = useState(5);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id && session) {
      fetchOrder();
    }
  }, [params.id, session, fetchOrder]);

  useEffect(() => {
    fetch("/api/checkout/offline-payment-copy")
      .then((r) => r.json())
      .then((d) => {
        if (d?.details) {
          setOfflineDetails({
            mbwayPhone: d.details.mbwayPhone || "",
            bankAccountName: d.details.bankAccountName || "",
            bankName: d.details.bankName || "",
            bankIban: d.details.bankIban || "",
            bankBic: d.details.bankBic || "",
          });
        }
        if (typeof d?.expiryDays === "number") {
          setOfflineExpiryDays(d.expiryDays);
        }
      })
      .catch(() => {});
  }, []);

  const confirmationToastFor = useRef<string | null>(null);

  useEffect(() => {
    if (!order) return;
    const key = `${order.id}:${order.status}:${order.manualPaymentStatus || ""}`;
    if (confirmationToastFor.current === key) return;
    confirmationToastFor.current = key;

    const awaiting = isManualPaymentAwaiting(order);
    if (awaiting) {
      toast(
        t("checkout.manualOrderPending"),
        "info",
        0,
        t("checkout.manualOrderThankYou")
      );
      return;
    }

    const effective = getEffectiveOrderStatus(order);
    const hintKey = {
      PENDING: "orderConfirmation.statusPendingHint",
      PROCESSING: "orderConfirmation.statusProcessingHint",
      SHIPPED: "orderConfirmation.statusShippedHint",
      DELIVERED: "orderConfirmation.statusDeliveredHint",
      CANCELLED: "orderConfirmation.statusCancelledHint",
    }[effective];

    toast(
      hintKey ? t(hintKey) : t("orderConfirmation.thankYouPaid"),
      effective === "CANCELLED" ? "warning" : "success",
      0,
      effective === "CANCELLED" ? undefined : t("orderConfirmation.thankYouPaid")
    );
  }, [order, t]);

  const parsedShipping = useMemo(
    () => parseOrderShippingAddress(order?.shippingAddress),
    [order?.shippingAddress]
  );

  const formatTrainingSessionDate = (value: string) =>
    new Date(value).toLocaleDateString(language === "pt" ? "pt-PT" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getStatusLabel = (status: string, awaiting: boolean) => {
    if (awaiting) return t("orderConfirmation.awaitingPayment");
    const key = status.toLowerCase() as "pending" | "processing" | "shipped" | "delivered" | "cancelled";
    const map = {
      pending: t("orders.pending"),
      processing: t("orders.processing"),
      shipped: t("orders.shipped"),
      delivered: t("orders.delivered"),
      cancelled: t("orders.cancelled"),
    };
    return map[key] ?? status;
  };

  const paymentMethodLabel = (method?: string | null) => {
    switch (method) {
      case "MBWAY":
        return t("checkout.payMbway");
      case "BANK_TRANSFER":
        return t("checkout.payBank");
      case "STRIPE_KLARNA":
        return t("checkout.payKlarna");
      case "STRIPE_CARD":
        return t("checkout.payCard");
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center font-header">
        {t("orderConfirmation.loading")}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center font-header">
        <p>{t("orderConfirmation.notFound")}</p>
        <Button onClick={() => router.push("/dashboard/orders")} className="mt-4">
          {t("orderConfirmation.goToDashboard")}
        </Button>
      </div>
    );
  }

  const awaitingManualPayment = isManualPaymentAwaiting(order);
  const effectiveStatus = getEffectiveOrderStatus(order);
  const orderRef = order.id.slice(0, 8).toUpperCase();
  const paymentLabel = paymentMethodLabel(order.shopPaymentMethod);
  const dateLabel = new Date(order.createdAt).toLocaleDateString(
    language === "pt" ? "pt-PT" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const trainingItems = order.trainingItems ?? [];
  const productSubtotal = order.items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );
  const trainingSubtotal = trainingItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );
  const subtotal = productSubtotal + trainingSubtotal;
  const shippingAmount = order.shippingAmount ? parseFloat(order.shippingAmount) : 0;
  const taxAmount = order.taxAmount ? parseFloat(order.taxAmount) : 0;
  const persistedTotal = parseFloat(order.total || "0") || 0;
  const calculatedTotal = subtotal + shippingAmount + taxAmount;
  const displayTotal =
    shippingAmount > 0 && Math.abs(persistedTotal - calculatedTotal) > 0.009
      ? calculatedTotal
      : persistedTotal;
  const hasLineItems = order.items.length > 0 || trainingItems.length > 0;
  const showPaymentPanel =
    awaitingManualPayment &&
    offlineDetails &&
    (order.shopPaymentMethod === "MBWAY" || order.shopPaymentMethod === "BANK_TRANSFER");

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 font-header sm:py-10">
      <header className="mb-8 border-b border-[#e8e4de] pb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand-champagne">
          {t("orderConfirmation.orderNumber", { id: orderRef })}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-black sm:text-4xl">
            {t("orderConfirmation.title")}
          </h1>
          <span className="inline-flex items-center border border-brand-champagne/35 bg-[#faf9f7] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-brand-champagne">
            {getStatusLabel(effectiveStatus, awaitingManualPayment)}
          </span>
        </div>
        <p className="mt-3 text-sm text-brand-black/50">
          {t("orderConfirmation.placedOn", { date: dateLabel })}
          {paymentLabel ? ` · ${paymentLabel}` : ""}
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="space-y-5">
          {showPaymentPanel && (
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-champagne">
                {t("orderConfirmation.howToPay")}
              </p>
              <OfflinePaymentPanel
                method={order.shopPaymentMethod === "MBWAY" ? "MBWAY" : "BANK"}
                details={offlineDetails}
                expiryDays={offlineExpiryDays}
                orderRef={`#${orderRef}`}
              />
            </div>
          )}

          {parsedShipping ? (
            <Section title={t("orderConfirmation.shippingAddress")}>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <AddressField label={t("orderConfirmation.contactName")} value={parsedShipping.name} />
                <AddressField label={t("orderConfirmation.contactEmail")} value={parsedShipping.email} />
                <AddressField label={t("orderConfirmation.contactPhone")} value={parsedShipping.phone} />
                <AddressField
                  label={t("orderConfirmation.address")}
                  value={parsedShipping.addressLines.join(", ")}
                />
                <AddressField label={t("orderConfirmation.postalCity")} value={parsedShipping.postalCity} />
                <AddressField label={t("orderConfirmation.district")} value={parsedShipping.district} />
                <AddressField label={t("orderConfirmation.country")} value={parsedShipping.country} />
              </dl>
            </Section>
          ) : order.shippingAddress ? (
            <Section title={t("orderConfirmation.shippingAddress")}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-black">
                {order.shippingAddress}
              </p>
            </Section>
          ) : null}

          {(order.billingNif || order.billingAddress) && (
            <Section title={t("orderConfirmation.billingInvoice")}>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <AddressField
                  label={t("orderConfirmation.nif")}
                  value={order.billingNif ? order.billingNif : null}
                />
                <AddressField label={t("orderConfirmation.address")} value={order.billingAddress} />
              </dl>
            </Section>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button onClick={() => router.push("/dashboard/orders")}>
              {t("orderConfirmation.viewAllOrders")}
            </Button>
            <Button variant="outline" onClick={() => router.push("/products")}>
              {t("orderConfirmation.continueShopping")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.open(`/api/orders/${order.id}/invoice`, "_blank");
              }}
            >
              {awaitingManualPayment
                ? t("orderConfirmation.downloadProforma")
                : t("orderConfirmation.downloadInvoice")}
            </Button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--site-header-height,113px)+1.5rem)] lg:self-start">
          <Section title={t("orderConfirmation.yourOrderItems")}>
            <div className="space-y-4">
              {!hasLineItems ? (
                <p className="py-2 text-center text-sm text-brand-black/45">
                  {t("orderConfirmation.noItems")}
                </p>
              ) : (
                <>
                  {trainingItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3.5 border-b border-[#eee8e0] pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-[#faf9f7]">
                        {item.program.image ? (
                          <Image
                            src={item.program.image}
                            alt={item.program.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized={
                              item.program.image.startsWith("data:") ||
                              item.program.image.startsWith("blob:")
                            }
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] font-medium uppercase tracking-wider text-brand-champagne">
                            {t("cart.trainingBadge")}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-brand-black">{item.program.title}</h3>
                        <p className="mt-0.5 text-xs text-brand-black/45">{t("cart.trainingProgram")}</p>
                        <p className="mt-0.5 text-xs text-brand-black/45">
                          {formatTrainingSessionDate(item.session.startDate)}
                          {item.session.location ? ` · ${item.session.location}` : ""}
                        </p>
                        <div className="mt-2 flex items-baseline justify-between gap-2">
                          <span className="text-xs text-brand-black/45">
                            {t("orderConfirmation.quantity")} 1
                          </span>
                          <span className="text-sm font-medium">
                            {formatPrice(parseFloat(item.price))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3.5 border-b border-[#eee8e0] pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-[#faf9f7]">
                        {item.product.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-contain p-1"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-brand-black/35">
                            {t("orderConfirmation.noImage")}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-brand-black">{item.product.name}</h3>
                        <p className="mt-0.5 text-xs text-brand-black/45">
                          {t("orderConfirmation.quantity")} {item.quantity}
                          {" · "}
                          {formatPrice(parseFloat(item.price))} {t("orderConfirmation.each")}
                        </p>
                        <p className="mt-2 text-right text-sm font-medium">
                          {formatPrice(parseFloat(item.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="mt-5 space-y-2 border-t border-[#e8e4de] pt-4">
              <div className="flex justify-between text-sm text-brand-black/55">
                <span>{t("orderConfirmation.subtotal")}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {shippingAmount > 0 && (
                <div className="flex justify-between text-sm text-brand-black/55">
                  <span>{t("orderConfirmation.shipping")}</span>
                  <span>{formatPrice(shippingAmount)}</span>
                </div>
              )}
              {order.taxAmount && order.taxRate && taxAmount > 0 && (
                <div className="flex justify-between text-sm text-brand-black/55">
                  <span>
                    {t("orderConfirmation.tax", {
                      label: order.taxRegion || `${order.taxRate}%`,
                    })}
                  </span>
                  <span>{formatPrice(taxAmount)}</span>
                </div>
              )}
              <p className="text-[11px] text-brand-black/40">{t("orderConfirmation.ivaIncluded")}</p>
              <div className="flex justify-between border-t border-[#e8e4de] pt-3 text-base font-semibold text-brand-black">
                <span>{t("orderConfirmation.total")}</span>
                <span>{formatPrice(displayTotal)}</span>
              </div>
            </div>
          </Section>
        </aside>
      </div>
    </div>
  );
}
