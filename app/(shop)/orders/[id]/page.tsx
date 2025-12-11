"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

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

export default function OrderConfirmationPage() {
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
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Order not found.</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600";
      case "PROCESSING":
        return "text-blue-600";
      case "SHIPPED":
        return "text-purple-600";
      case "DELIVERED":
        return "text-green-600";
      case "CANCELLED":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Order Confirmation</h1>

      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
        <p className="text-green-800 font-semibold">
          Thank you for your order! Your payment has been processed successfully.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Container - Order Information */}
        <div className="lg:pr-8">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                <span className={`font-semibold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p>{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              {order.shippingAddress && (
                <div>
                  <p className="text-sm text-gray-600">Shipping Address</p>
                  <p>{order.shippingAddress}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center pb-4 border-b">
                    <div>
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">
                      {formatPrice(parseFloat(item.price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={() => router.push("/dashboard")}>
              View All Orders
            </Button>
            <Button variant="outline" onClick={() => router.push("/products")}>
              Continue Shopping
            </Button>
          </div>
        </div>

        {/* Right Container - Product Photos and Info */}
        <div className="lg:pl-8">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Your Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {order.items.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No items in this order</p>
                ) : (
                  order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-6 border-b last:border-b-0 last:pb-0">
                      {/* Product Image */}
                      <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {item.product.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{item.product.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-500">Quantity: {item.quantity}</span>
                          <span className="font-semibold">
                            {formatPrice(parseFloat(item.price) * item.quantity)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {formatPrice(parseFloat(item.price))} each
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

