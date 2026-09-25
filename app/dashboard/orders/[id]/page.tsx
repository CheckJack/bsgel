"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { showPurchaseDeniedToast } from "@/lib/stock-client";
import { useLanguage } from "@/contexts/language-context";
import { parseOrderShippingAddress } from "@/lib/parse-order-shipping-address";
import {
  getEffectiveOrderStatus,
  isManualPaymentAwaiting,
} from "@/lib/order-status-display";
import { OfflinePaymentPanel } from "@/components/checkout/offline-payment-panel";
import type { OfflinePaymentDetails } from "@/lib/checkout/offline-payment-instructions";
import {
  OrderAddressField,
  OrderSection,
  OrderStatusBadge,
} from "@/components/orders/order-ui";
import { RotateCcw, Download, Loader2, ArrowLeft, X } from "lucide-react";

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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { t, language } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [offlineDetails, setOfflineDetails] = useState<OfflinePaymentDetails | null>(null);
  const [offlineExpiryDays, setOfflineExpiryDays] = useState(5);

  const fetchOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        const error = await res.json();
        toast(error.error || t("clientPanel.orders.loadOrderFailed"), "error");
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast(t("clientPanel.orders.loadOrderFailedRetry"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, t]);

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

  const parsedShipping = useMemo(
    () => parseOrderShippingAddress(order?.shippingAddress),
    [order?.shippingAddress]
  );

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm(t("clientPanel.orders.cancelConfirm"))) {
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (res.ok) {
        toast(t("clientPanel.orders.cancelSuccess"), "success");
        fetchOrder();
      } else {
        const error = await res.json();
        toast(error.error || t("clientPanel.orders.cancelFailed"), "error");
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast(t("clientPanel.orders.cancelFailedRetry"), "error");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;

    setIsReordering(true);
    try {
      const res = await fetch("/api/cart/add-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: order.items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (res.ok) {
        toast(t("clientPanel.orders.reorderSuccess"), "success");
        router.push("/cart");
      } else {
        const error = await res.json();
        if (res.status === 403) {
          showPurchaseDeniedToast(error, t);
        } else {
          toast(error.error || t("clientPanel.orders.reorderFailed"), "error");
        }
      }
    } catch (error) {
      console.error("Failed to reorder:", error);
      toast(t("clientPanel.orders.reorderFailedRetry"), "error");
    } finally {
      setIsReordering(false);
    }
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

  const formatTrainingSessionDate = (value: string) =>
    new Date(value).toLocaleDateString(language === "pt" ? "pt-PT" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-champagne" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-sm text-brand-black/55">{t("clientPanel.orders.notFound")}</p>
        <Button
          onClick={() => router.push("/dashboard/orders")}
          className="rounded-none"
        >
          {t("clientPanel.orders.backToOrders")}
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
  const canCancel = order.status === "PENDING" || order.status === "PROCESSING";
  const canReorder = order.status === "DELIVERED";
  const showPaymentPanel =
    awaitingManualPayment &&
    offlineDetails &&
    (order.shopPaymentMethod === "MBWAY" || order.shopPaymentMethod === "BANK_TRANSFER");

  return (
    <div>
      <Link
        href="/dashboard/orders"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-brand-champagne transition-colors hover:text-brand-black"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("clientPanel.orders.backToOrders")}
      </Link>

      <header className="mb-8 border-b border-[#e8e4de] pb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand-champagne">
          {t("clientPanel.orders.orderNumber", { id: orderRef })}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-black sm:text-4xl">
            {t("clientPanel.orders.detailsTitle")}
          </h1>
          <OrderStatusBadge status={effectiveStatus} awaiting={awaitingManualPayment} />
        </div>
        <p className="mt-3 text-sm text-brand-black/50">
          {t("orderConfirmation.placedOn", { date: dateLabel })}
          {paymentLabel ? ` · ${paymentLabel}` : ""}
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="space-y-5">
          {showPaymentPanel ? (
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
          ) : null}

          {parsedShipping ? (
            <OrderSection title={t("orderConfirmation.shippingAddress")}>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <OrderAddressField
                  label={t("orderConfirmation.contactName")}
                  value={parsedShipping.name}
                />
                <OrderAddressField
                  label={t("orderConfirmation.contactEmail")}
                  value={parsedShipping.email}
                />
                <OrderAddressField
                  label={t("orderConfirmation.contactPhone")}
                  value={parsedShipping.phone}
                />
                <OrderAddressField
                  label={t("orderConfirmation.address")}
                  value={parsedShipping.addressLines.join(", ")}
                />
                <OrderAddressField
                  label={t("orderConfirmation.postalCity")}
                  value={parsedShipping.postalCity}
                />
                <OrderAddressField
                  label={t("orderConfirmation.district")}
                  value={parsedShipping.district}
                />
                <OrderAddressField
                  label={t("orderConfirmation.country")}
                  value={parsedShipping.country}
                />
              </dl>
            </OrderSection>
          ) : order.shippingAddress ? (
            <OrderSection title={t("orderConfirmation.shippingAddress")}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-black">
                {order.shippingAddress}
              </p>
            </OrderSection>
          ) : null}

          {(order.billingNif || order.billingAddress) && (
            <OrderSection title={t("orderConfirmation.billingInvoice")}>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <OrderAddressField
                  label={t("orderConfirmation.nif")}
                  value={order.billingNif}
                />
                <OrderAddressField
                  label={t("orderConfirmation.address")}
                  value={order.billingAddress}
                />
              </dl>
            </OrderSection>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => window.open(`/api/orders/${order.id}/invoice`, "_blank")}
              className="rounded-none border-[#e8e4de]"
            >
              <Download className="mr-2 h-4 w-4" />
              {awaitingManualPayment
                ? t("orderConfirmation.downloadProforma")
                : t("orderConfirmation.downloadInvoice")}
            </Button>
            {canCancel ? (
              <Button
                variant="outline"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="rounded-none border-[#e8e4de] text-red-700 hover:text-red-800"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("clientPanel.orders.cancelling")}
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    {t("clientPanel.orders.cancelOrder")}
                  </>
                )}
              </Button>
            ) : null}
            {canReorder ? (
              <Button
                variant="outline"
                onClick={handleReorder}
                disabled={isReordering}
                className="rounded-none border-[#e8e4de]"
              >
                {isReordering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("clientPanel.orders.addingToCart")}
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t("clientPanel.orders.reorder")}
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--site-header-height,113px)+1.5rem)] lg:self-start">
          <OrderSection title={t("clientPanel.orders.orderItems")}>
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
                        <h3 className="text-sm font-medium text-brand-black">
                          {item.program.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-brand-black/45">
                          {t("cart.trainingProgram")}
                        </p>
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
                        <h3 className="text-sm font-medium text-brand-black">
                          {item.product.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-brand-black/45">
                          {t("orderConfirmation.quantity")} {item.quantity}
                          {" · "}
                          {formatPrice(parseFloat(item.price))}{" "}
                          {t("orderConfirmation.each")}
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
              {shippingAmount > 0 ? (
                <div className="flex justify-between text-sm text-brand-black/55">
                  <span>{t("orderConfirmation.shipping")}</span>
                  <span>{formatPrice(shippingAmount)}</span>
                </div>
              ) : null}
              {order.taxAmount && order.taxRate && taxAmount > 0 ? (
                <div className="flex justify-between text-sm text-brand-black/55">
                  <span>
                    {t("orderConfirmation.tax", {
                      label: order.taxRegion || `${order.taxRate}%`,
                    })}
                  </span>
                  <span>{formatPrice(taxAmount)}</span>
                </div>
              ) : null}
              <p className="text-[11px] text-brand-black/40">
                {t("orderConfirmation.ivaIncluded")}
              </p>
              <div className="flex justify-between border-t border-[#e8e4de] pt-3 text-base font-semibold text-brand-black">
                <span>{t("orderConfirmation.total")}</span>
                <span>{formatPrice(displayTotal)}</span>
              </div>
            </div>
          </OrderSection>
        </aside>
      </div>
    </div>
  );
}
