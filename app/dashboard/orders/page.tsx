"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import {
  Search,
  Filter,
  X,
  ArrowUpDown,
  RotateCcw,
  Download,
  Loader2,
} from "lucide-react";

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
  status: string;
  createdAt: string;
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
        toast(error.error || "Failed to load orders", "error");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast("Failed to load orders. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) {
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
        toast("Order cancelled successfully", "success");
        fetchOrders();
      } else {
        const error = await res.json();
        toast(error.error || "Failed to cancel order", "error");
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast("Failed to cancel order. Please try again.", "error");
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
        toast("Items added to cart successfully", "success");
        router.push("/cart");
      } else {
        const error = await res.json();
        toast(error.error || "Failed to add items to cart", "error");
      }
    } catch (error) {
      console.error("Failed to reorder:", error);
      toast("Failed to add items to cart. Please try again.", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "DELIVERED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const canCancel = (orderStatus: string) => {
    return orderStatus === "PENDING" || orderStatus === "PROCESSING";
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Order History</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View all your past purchases and order details
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by order ID or product name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="date">Sort by Date</option>
                <option value="total">Sort by Total</option>
                <option value="status">Sort by Status</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
              {searchQuery || statusFilter !== "all"
                ? "No orders found matching your filters."
                : "You haven't placed any orders yet."}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link href="/products">
                <Button className="px-6 py-2">Start Shopping</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg mb-2">{formatPrice(order.total)}</p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.product.name} x{item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatPrice(parseFloat(item.price) * item.quantity)}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        +{order.items.length - 3} more item(s)
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View Details →
                      </Button>
                    </Link>
                    {canCancel(order.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingOrderId === order.id}
                      >
                        {cancellingOrderId === order.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          "Cancel Order"
                        )}
                      </Button>
                    )}
                    {order.status === "DELIVERED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReorder(order)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reorder
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
