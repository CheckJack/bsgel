"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { toast } from "@/components/ui/toast";
import { parseOrderShippingAddress } from "@/lib/parse-order-shipping-address";
import { isManualPaymentAwaiting } from "@/lib/order-status-display";
import {
  getOrderAdminActions,
  type OrderStatus as AdminOrderStatus,
} from "@/lib/order-admin-actions";

type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

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
  status: OrderStatus;
  shippingAddress: string | null;
  billingNif?: string | null;
  billingAddress?: string | null;
  shopPaymentMethod?: string | null;
  manualPaymentStatus?: string | null;
  paymentIntentId?: string | null;
  appliedCouponCode?: string | null;
  shippingAmount?: string | null;
  taxRate: number | null;
  taxAmount: string | null;
  taxRegion: string | null;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  };
  items: OrderItem[];
  trainingItems?: OrderTrainingItem[];
}

function AddressField({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}

function paymentMethodLabel(method: string | null | undefined, t: (key: string) => string) {
  switch (method) {
    case "STRIPE_CARD":
      return t("orders.paymentStripeCard");
    case "STRIPE_KLARNA":
      return t("orders.paymentStripeKlarna");
    case "MBWAY":
      return t("orders.paymentMbway");
    case "BANK_TRANSFER":
      return t("orders.paymentBank");
    default:
      return method ? method : t("orders.paymentLegacy");
  }
}

function statusBadgeClass(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-900";
    case "PROCESSING":
      return "bg-blue-100 text-blue-900";
    case "SHIPPED":
      return "bg-purple-100 text-purple-900";
    case "DELIVERED":
      return "bg-green-100 text-green-900";
    case "CANCELLED":
      return "bg-red-100 text-red-900";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { t, language } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [manualBusy, setManualBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("PROCESSING");
  const [activeTab, setActiveTab] = useState<"products" | "customer">("products");

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setSelectedStatus(data.status);
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

  const patchOrder = async (
    payload: { status?: AdminOrderStatus; manualPaymentAction?: "confirm" | "cancel" },
    setBusy: (value: boolean) => void = setActionBusy
  ) => {
    if (!order) return false;

    setBusy(true);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast(
          typeof data.error === "string" ? data.error : t("orders.statusSaveError"),
          "error"
        );
        return false;
      }

      setOrder(data);
      setSelectedStatus(data.status);
      toast(t("orders.statusSaved"), "success");
      return true;
    } finally {
      setBusy(false);
    }
  };

  const patchManualPayment = async (action: "confirm" | "cancel") => {
    await patchOrder({ manualPaymentAction: action }, setManualBusy);
  };

  const saveStatus = async () => {
    if (!order || selectedStatus === order.status) return;
    await patchOrder({ status: selectedStatus }, setStatusBusy);
  };

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

  const getStatusLabel = (status: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      PENDING: t("orders.pending"),
      PROCESSING: t("orders.processing"),
      SHIPPED: t("orders.shipped"),
      DELIVERED: t("orders.delivered"),
      CANCELLED: t("orders.cancelled"),
    };
    return map[status];
  };

  const getWorkflowMessage = (current: Order) => {
    if (isManualPaymentAwaiting(current)) {
      return t("orders.workflowPendingManual");
    }
    const hasProducts = current.items.length > 0;
    const hasTraining = (current.trainingItems?.length ?? 0) > 0;

    switch (current.status) {
      case "PENDING":
        return t("orders.workflowPendingManual");
      case "PROCESSING":
        return hasTraining && !hasProducts
          ? t("orders.workflowProcessingTraining")
          : t("orders.workflowProcessing");
      case "SHIPPED":
        return t("orders.workflowShipped");
      case "DELIVERED":
        return t("orders.workflowDelivered");
      case "CANCELLED":
        return t("orders.workflowCancelled");
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!order || !session || session.user.role !== "ADMIN") {
    return (
      <div className="px-4 py-8 text-center">
        <p>{t("orders.notFound")}</p>
        <Button onClick={() => router.push("/admin/orders")} className="mt-4">
          {t("orders.backToOrders")}
        </Button>
      </div>
    );
  }

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
  const shipping = order.shippingAmount ? parseFloat(order.shippingAmount) : 0;
  const total = parseFloat(order.total);
  const awaitingManual = isManualPaymentAwaiting(order);
  const adminActions = getOrderAdminActions(order);
  const quickActions = adminActions.filter((action) => action.type === "set_status");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="size-4" />
            {t("orders.backToOrders")}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
            {t("orderConfirmation.orderNumber", { id: order.id.slice(0, 8) })}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString(language === "pt" ? "pt-PT" : "en-GB")}
          </p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-wide ${statusBadgeClass(order.status)}`}
        >
          {getStatusLabel(order.status)}
        </span>
      </div>

      <Card className="border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("orders.workflowTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-800 dark:text-gray-200">
          {getWorkflowMessage(order)}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="border-b border-gray-200 dark:border-gray-700" role="tablist">
            <div className="flex flex-wrap gap-6">
              {(
                [
                  { id: "products" as const, label: t("orders.tabProducts") },
                  { id: "customer" as const, label: t("orders.tabCustomer") },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "border-b-2 px-0 pb-3 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100"
                      : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "products" && (
            <div className="space-y-6 pt-2" role="tabpanel">
              {trainingItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("orders.trainingSection")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trainingItems.map((item) => (
                      <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-brand-champagne/15">
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
                            <div className="flex size-full items-center justify-center text-[10px] font-medium uppercase text-gray-500">
                              {t("cart.trainingBadge")}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {item.program.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {formatTrainingSessionDate(item.session.startDate)}
                            {item.session.location ? ` · ${item.session.location}` : ""}
                          </p>
                          <p className="mt-2 text-sm font-medium">
                            {formatPrice(parseFloat(item.price))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {order.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("orders.productsSection")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {item.product.image ? (
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-contain"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-[10px] text-gray-400">
                              —
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {item.product.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {t("orders.quantity")}: {item.quantity}
                          </p>
                          <p className="mt-2 text-sm font-medium">
                            {formatPrice(parseFloat(item.price) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {order.items.length === 0 && trainingItems.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    {t("orders.noItems")}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>{t("orders.summary")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("orders.subtotal")}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("orders.shipping")}</span>
                    <span>{formatPrice(shipping)}</span>
                  </div>
                  {order.taxRegion && (
                    <div className="flex justify-between text-gray-600">
                      <span>{order.taxRegion}</span>
                      <span>
                        {order.taxAmount ? formatPrice(parseFloat(order.taxAmount)) : "—"}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">{t("orders.ivaIncluded")}</p>
                  <div className="flex justify-between border-t pt-3 text-base font-bold">
                    <span>{t("orders.total")}</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "customer" && (
            <div className="space-y-6 pt-2" role="tabpanel">
              <Card>
                <CardHeader>
                  <CardTitle>{t("orders.customerSection")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {order.user.name || "—"}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">{order.user.email}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("orders.paymentSection")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <span className="text-gray-500">{t("checkout.paymentMethod")}: </span>
                    {paymentMethodLabel(order.shopPaymentMethod, t)}
                  </p>
                  {order.paymentIntentId && (
                    <p className="break-all">
                      <span className="text-gray-500">{t("orders.stripePaymentId")}: </span>
                      {order.paymentIntentId}
                    </p>
                  )}
                  {order.appliedCouponCode && (
                    <p>
                      <span className="text-gray-500">{t("orders.coupon")}: </span>
                      {order.appliedCouponCode}
                    </p>
                  )}
                  {awaitingManual && (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                      {t("orders.paymentInfoReadOnly")}
                    </p>
                  )}
                </CardContent>
              </Card>

              {parsedShipping ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("orders.shippingSection")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <AddressField label={t("orders.contactName")} value={parsedShipping.name} />
                      <AddressField label={t("orders.contactEmail")} value={parsedShipping.email} />
                      <AddressField label={t("orders.contactPhone")} value={parsedShipping.phone} />
                      <AddressField
                        label={t("orders.address")}
                        value={parsedShipping.addressLines.join(", ")}
                      />
                      <AddressField label={t("orders.postalCity")} value={parsedShipping.postalCity} />
                      <AddressField label={t("orders.district")} value={parsedShipping.district} />
                      <AddressField label={t("orders.country")} value={parsedShipping.country} />
                    </dl>
                  </CardContent>
                </Card>
              ) : order.shippingAddress ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("orders.shippingSection")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                      {order.shippingAddress}
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {(order.billingNif || order.billingAddress) && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("orders.billingSection")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {order.billingNif && (
                      <p>
                        <span className="text-gray-500">{t("orders.nif")}: </span>
                        {order.billingNif}
                      </p>
                    )}
                    {order.billingAddress && (
                      <p className="whitespace-pre-wrap">{order.billingAddress}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("orders.orderActionsTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {t("orders.orderStatus")}
                  </p>
                  <p
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-wide ${statusBadgeClass(order.status)}`}
                  >
                    {getStatusLabel(order.status)}
                  </p>
                </div>

                {awaitingManual && (
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t("orders.paymentStep")}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t("orders.paymentActionsHint")}
                    </p>
                    <Button
                      className="w-full"
                      disabled={manualBusy || actionBusy}
                      onClick={() => patchManualPayment("confirm")}
                    >
                      {manualBusy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        t("orders.confirmPaymentReceived")
                      )}
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={manualBusy || actionBusy}
                      onClick={() => patchManualPayment("cancel")}
                    >
                      {t("orders.cancelOrder")}
                    </Button>
                  </div>
                )}

                {!awaitingManual && quickActions.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t("orders.fulfilmentStep")}
                    </p>
                    {quickActions.map((action) =>
                      action.type === "set_status" ? (
                        <Button
                          key={action.status}
                          className="w-full"
                          variant={action.variant === "outline" ? "outline" : "default"}
                          disabled={actionBusy || manualBusy || statusBusy}
                          onClick={() => patchOrder({ status: action.status })}
                        >
                          {actionBusy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            t(action.labelKey)
                          )}
                        </Button>
                      ) : null
                    )}
                  </div>
                )}

                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t("orders.statusOverride")}
                  </p>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    disabled={actionBusy || manualBusy || statusBusy}
                  >
                    <option value="PENDING">{t("orders.pending")}</option>
                    <option value="PROCESSING">{t("orders.processing")}</option>
                    <option value="SHIPPED">{t("orders.shipped")}</option>
                    <option value="DELIVERED">{t("orders.delivered")}</option>
                    <option value="CANCELLED">{t("orders.cancelled")}</option>
                  </select>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={saveStatus}
                    disabled={
                      statusBusy ||
                      actionBusy ||
                      manualBusy ||
                      selectedStatus === order.status
                    }
                  >
                    {statusBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      t("orders.saveStatus")
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
