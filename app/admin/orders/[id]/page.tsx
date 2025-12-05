"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { Truck, ChevronDown } from "lucide-react";

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
  user: {
    email: string;
    name: string | null;
  };
  items: OrderItem[];
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock order data for demonstration
  const mockOrder: Order = {
    id: "7712309",
    total: "1452.50",
    status: "DELIVERED",
    shippingAddress: "3517 W. Gray St. Utica, Pennsylvania 57867",
    createdAt: new Date("2023-11-20").toISOString(),
    user: {
      email: "kristin.watson@example.com",
      name: "Kristin Watson",
    },
    items: [
      {
        id: "mock-item-1",
        quantity: 1,
        price: "50.47",
        product: {
          id: "mock-product-1",
          name: "Kristin Watson",
          image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=100&h=100&fit=crop",
        },
      },
      {
        id: "mock-item-2",
        quantity: 1,
        price: "50.47",
        product: {
          id: "mock-product-2",
          name: "Kristin Watson",
          image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=100&h=100&fit=crop",
        },
      },
      {
        id: "mock-item-3",
        quantity: 1,
        price: "50.47",
        product: {
          id: "mock-product-3",
          name: "Kristin Watson",
          image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=100&h=100&fit=crop",
        },
      },
    ],
  };

  useEffect(() => {
    if (params.id && session) {
      // Check if it's the mock order
      if (params.id === "7712309") {
        setOrder(mockOrder);
        setIsLoading(false);
      } else {
        fetchOrder();
      }
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!order || !session || session.user.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Order not found or unauthorized.</p>
        <Button onClick={() => router.push("/admin/orders")} className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  // Calculate totals
  const subtotal = order.items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );
  const shipping = 10.0; // Fixed shipping cost
  const tax = 5.0; // Fixed tax (GST)
  const total = parseFloat(order.total);

  // Format date
  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Calculate expected delivery date (7 days from order date)
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Format order ID for display
  const displayOrderId = order.id.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order #{displayOrderId}</h1>
        </div>
        <div className="text-sm text-gray-600">
          Dashboard <span className="mx-2">&gt;</span> Order <span className="mx-2">&gt;</span> Order
          detail <span className="mx-2">&gt;</span>{" "}
          <span className="text-gray-900 font-medium">Order #{displayOrderId}</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* All Items Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">All item</CardTitle>
                <div className="relative">
                  <select className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Sort</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Name: A to Z</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                >
                  {item.product.image ? (
                    <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Product name</p>
                    <p className="font-medium text-gray-900 mb-3">{item.product.name}</p>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Quantity</p>
                        <p className="font-medium text-gray-900">{item.quantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Price</p>
                        <p className="font-medium text-gray-900">
                          {formatPrice(parseFloat(item.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Cart Totals Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Cart Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Shipping:</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax (GST):</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total price:</span>
                <span className="font-bold text-orange-600 text-lg">{formatPrice(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary and Details */}
        <div className="space-y-6">
          {/* Summary Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Order ID</p>
                <p className="font-medium text-gray-900">#{displayOrderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="font-medium text-gray-900">{formattedDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="font-medium text-orange-600 text-lg">{formatPrice(total)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                {order.shippingAddress ||
                  "3517 W. Gray St. Utica, Pennsylvania 57867"}
              </p>
            </CardContent>
          </Card>

          {/* Payment Method Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                Pay on Delivery (Cash/Card). Cash on delivery (COD) available. Card/Net banking
                acceptance subject to device availability.
              </p>
            </CardContent>
          </Card>

          {/* Expected Date Of Delivery Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Expected Date Of Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-green-600 font-medium text-lg">{formattedDeliveryDate}</p>
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2">
                <Truck className="h-4 w-4" />
                Track order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

