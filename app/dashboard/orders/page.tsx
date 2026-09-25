"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { useLanguage } from "@/contexts/language-context";
import { OrderStatusBadge } from "@/components/orders/order-ui";
import { Search, X, ArrowUpDown, RotateCcw, Loader2, ChevronRight } from "lucide-react";

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

interface Order {
  id: string;
  total: string;
  shippingAmount?: string | null;
  taxAmount?: string | null;
  status: string;
  createdAt: string;
  shopPaymentMethod?: string | null;
  manualPaymentStatus?: string | null;
  paymentIntentId?: string | null;
  items: OrderItem[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function OrderHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "total" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      fetchOrders();
    }
  }, [session, status, router, statusFilter, sortBy, sortOrder, currentPage, searchQuery]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: "10",
      });
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || data);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        const error = await res.json();
        toast(error.error || t("clientPanel.orders.loadFailed"), "error");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast(t("clientPanel.orders.loadFailedRetry"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(t("clientPanel.orders.cancelConfirm"))) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (res.ok) {
        toast(t("clientPanel.orders.cancelSuccess"), "success");
        fetchOrders();
      } else {
        const error = await res.json();
        toast(error.error || t("clientPanel.orders.cancelFailed"), "error");
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast(t("clientPanel.orders.cancelFailedRetry"), "error");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleReorder = async (order: Order) => {
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
          const { showPurchaseDeniedToast } = await import("@/lib/stock-client");
          showPurchaseDeniedToast(error, t);
        } else {
          toast(error.error || t("clientPanel.orders.reorderFailed"), "error");
        }
      }
    } catch (error) {
      console.error("Failed to reorder:", error);
      toast(t("clientPanel.orders.reorderFailedRetry"), "error");
    }
  };

  const canCancel = (orderStatus: string) =>
    orderStatus === "PENDING" || orderStatus === "PROCESSING";

  const isAwaitingPayment = (order: Order) =>
    (order.shopPaymentMethod === "MBWAY" || order.shopPaymentMethod === "BANK_TRANSFER") &&
    order.status === "PENDING" &&
    (order.manualPaymentStatus === "PENDING" || order.manualPaymentStatus == null);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-champagne" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const selectClass =
    "h-10 border border-[#e8e4de] bg-white px-3 text-sm text-brand-black outline-none focus:border-brand-champagne";

  return (
    <div>
      <header className="mb-8 border-b border-[#e8e4de] pb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand-champagne">
          {t("clientPanel.sidebar.myAccount")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-black sm:text-4xl">
          {t("clientPanel.orders.title")}
        </h1>
        <p className="mt-2 text-sm text-brand-black/50">{t("clientPanel.orders.description")}</p>
      </header>

      <div className="mb-6 border border-[#e8e4de] bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-black/35" />
            <Input
              placeholder={t("clientPanel.orders.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 rounded-none border-[#e8e4de] pl-10 focus-visible:ring-brand-champagne"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/35 hover:text-brand-black"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={selectClass}
          >
            <option value="all">{t("clientPanel.orders.allStatus")}</option>
            <option value="PENDING">{t("clientPanel.orders.pending")}</option>
            <option value="PROCESSING">{t("clientPanel.orders.processing")}</option>
            <option value="SHIPPED">{t("clientPanel.orders.shipped")}</option>
            <option value="DELIVERED">{t("clientPanel.orders.delivered")}</option>
            <option value="CANCELLED">{t("clientPanel.orders.cancelled")}</option>
          </select>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "total" | "status")}
              className={selectClass}
            >
              <option value="date">{t("clientPanel.orders.sortByDate")}</option>
              <option value="total">{t("clientPanel.orders.sortByTotal")}</option>
              <option value="status">{t("clientPanel.orders.sortByStatus")}</option>
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="h-10 rounded-none border-[#e8e4de] px-3"
              aria-label="Sort order"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="border border-[#e8e4de] bg-white px-6 py-16 text-center">
          <p className="text-sm text-brand-black/55">
            {searchQuery || statusFilter !== "all"
              ? t("clientPanel.orders.noOrdersFound")
              : t("clientPanel.orders.noOrdersYet")}
          </p>
          {!searchQuery && statusFilter === "all" ? (
            <Link href="/products" className="mt-5 inline-block">
              <Button className="rounded-none">{t("clientPanel.orders.startShopping")}</Button>
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <div className="divide-y divide-[#e8e4de] border border-[#e8e4de] bg-white">
            {orders.map((order) => {
              const thumb = order.items[0]?.product;
              const awaiting = isAwaitingPayment(order);
              const productSubtotal = order.items.reduce(
                (sum, item) => sum + parseFloat(item.price) * item.quantity,
                0
              );
              const shippingAmount = order.shippingAmount ? parseFloat(order.shippingAmount) : 0;
              const taxAmount = order.taxAmount ? parseFloat(order.taxAmount) : 0;
              const persistedTotal = parseFloat(order.total || "0") || 0;
              const calculatedTotal = productSubtotal + shippingAmount + taxAmount;
              const displayTotal =
                shippingAmount > 0 && Math.abs(persistedTotal - calculatedTotal) > 0.009
                  ? calculatedTotal
                  : persistedTotal;
              return (
                <article key={order.id} className="p-4 transition-colors hover:bg-[#faf9f7] sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3.5">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-[#faf9f7]">
                        {thumb?.image ? (
                          <Image
                            src={thumb.image}
                            alt={thumb.name}
                            fill
                            className="object-contain p-1"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-wider text-brand-champagne">
                            {order.items.length || "—"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-medium text-brand-black">
                            {t("clientPanel.orders.orderNumber", {
                              id: order.id.slice(0, 8).toUpperCase(),
                            })}
                          </h2>
                          <OrderStatusBadge status={order.status} awaiting={awaiting} />
                        </div>
                        <p className="mt-1 text-xs text-brand-black/45">
                          {new Date(order.createdAt).toLocaleDateString(
                            language === "pt" ? "pt-PT" : "en-GB",
                            { day: "numeric", month: "long", year: "numeric" }
                          )}
                        </p>
                        <div className="mt-2 space-y-0.5">
                          {order.items.slice(0, 2).map((item) => (
                            <p key={item.id} className="truncate text-sm text-brand-black/70">
                              {item.product.name}
                              <span className="text-brand-black/40"> ×{item.quantity}</span>
                            </p>
                          ))}
                          {order.items.length > 2 ? (
                            <p className="text-xs text-brand-black/40">
                              {t("clientPanel.orders.moreItems", {
                                count: String(order.items.length - 2),
                              })}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch gap-3 sm:items-end">
                      <p className="text-lg font-semibold text-brand-black">
                        {formatPrice(displayTotal)}
                      </p>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-none border-[#e8e4de]"
                          >
                            {t("clientPanel.orders.viewDetails")}
                            <ChevronRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        {canCancel(order.status) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrderId === order.id}
                            className="rounded-none border-[#e8e4de]"
                          >
                            {cancellingOrderId === order.id ? (
                              <>
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                {t("clientPanel.orders.cancelling")}
                              </>
                            ) : (
                              t("clientPanel.orders.cancelOrder")
                            )}
                          </Button>
                        ) : null}
                        {order.status === "DELIVERED" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReorder(order)}
                            className="rounded-none border-[#e8e4de]"
                          >
                            <RotateCcw className="mr-2 h-3.5 w-3.5" />
                            {t("clientPanel.orders.reorder")}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-none border-[#e8e4de]"
              >
                {t("clientPanel.orders.previous")}
              </Button>
              <span className="text-xs uppercase tracking-[0.12em] text-brand-black/45">
                {t("clientPanel.orders.page", {
                  current: String(pagination.page),
                  total: String(pagination.totalPages),
                })}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="rounded-none border-[#e8e4de]"
              >
                {t("clientPanel.orders.next")}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
