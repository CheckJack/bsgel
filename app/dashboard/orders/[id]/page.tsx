"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

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

  useEffect(() => {
    if (params.id && session) {
      fetchOrder();
    }
  }, [params.id, session]);

  const fetchOrder = async () => {
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
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
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

      <div className="max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Placed on {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.shippingAddress && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Shipping Address</p>
                <p className="text-gray-900 dark:text-gray-100">{order.shippingAddress}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
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

