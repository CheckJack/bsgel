"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import Image from "next/image";
import { RotateCcw, Download, Loader2, X } from "lucide-react";

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
  shippingAddress: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    if (params.id && session) {
      fetchOrder();
    }
  }, [params.id, session]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        const error = await res.json();
        toast(error.error || "Failed to load order", "error");
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast("Failed to load order. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm("Are you sure you want to cancel this order?")) {
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
        toast("Order cancelled successfully", "success");
        fetchOrder();
      } else {
        const error = await res.json();
        toast(error.error || "Failed to cancel order", "error");
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast("Failed to cancel order. Please try again.", "error");
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
        toast("Items added to cart successfully", "success");
        router.push("/cart");
      } else {
        const error = await res.json();
        toast(error.error || "Failed to add items to cart", "error");
      }
    } catch (error) {
      console.error("Failed to reorder:", error);
      toast("Failed to add items to cart. Please try again.", "error");
    } finally {
      setIsReordering(false);
    }
  };

  const formatAddress = (addressString: string | null) => {
    if (!addressString) return null;
    try {
      const parsed = JSON.parse(addressString);
      return (
        <div className="space-y-1">
          <p className="font-medium">{parsed.firstName} {parsed.lastName}</p>
          <p>{parsed.addressLine1}</p>
          {parsed.addressLine2 && <p>{parsed.addressLine2}</p>}
          <p>{parsed.city}, {parsed.postalCode}</p>
          <p>{parsed.district}</p>
          <p>{parsed.country}</p>
          {parsed.phone && <p className="mt-2">Phone: {parsed.phone}</p>}
        </div>
      );
    } catch {
      return <p>{addressString}</p>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Order not found.</p>
        <Button onClick={() => router.push("/dashboard/orders")} className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-800 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "PROCESSING":
        return "text-blue-800 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300";
      case "SHIPPED":
        return "text-purple-800 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300";
      case "DELIVERED":
        return "text-green-800 bg-green-100 dark:bg-green-900/30 dark:text-green-300";
      case "CANCELLED":
        return "text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "text-gray-800 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const canCancel = order.status === "PENDING" || order.status === "PROCESSING";
  const canReorder = order.status === "DELIVERED";

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Order Details</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View detailed information about your order
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/orders")}>
          Back to Orders
        </Button>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Placed on {new Date(order.createdAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                {canCancel && (
                  <Button
                    variant="outline"
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="text-red-600 hover:text-red-700"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel Order
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.shippingAddress && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Shipping Address</p>
                <div className="text-gray-900 dark:text-gray-100">
                  {formatAddress(order.shippingAddress)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Order Items</CardTitle>
              {canReorder && (
                <Button
                  variant="outline"
                  onClick={handleReorder}
                  disabled={isReordering}
                >
                  {isReordering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reorder
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                  {item.product.image && (
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.product.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatPrice(parseFloat(item.price) * item.quantity)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatPrice(item.price)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t dark:border-gray-700 flex justify-between font-bold text-xl text-gray-900 dark:text-gray-100">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
