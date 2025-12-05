"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, FileDown, Settings, Users, BookOpen, MapPin, MessageCircle, ArrowRight } from "lucide-react";

interface Order {
  id: string;
  total: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      fetchOrders();
    }
  }, [session, status, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const recentOrders = orders.slice(0, 3);
  const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
  
  // Check if user is pending certification confirmation
  const certification = session.user?.certification as string | undefined;
  const isPendingCertification = certification === "PROFESSIONAL_NON_CERTIFIED";
  const hasConfirmedCertification = certification === "INITIATION" || certification === "PROFESSIONAL";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {session.user?.name || session.user?.email?.split("@")[0] || "User"}!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here&apos;s an overview of your account
        </p>
        {isPendingCertification && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Your certification is pending confirmation. Once confirmed, you&apos;ll have access to all dashboard features.
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats - Only show if not pending or if confirmed */}
      {(hasConfirmedCertification || !isPendingCertification) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{orders.length}</div>
              <Link href="/dashboard/orders" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
                View all orders →
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatPrice(totalSpent.toString())}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Across all orders
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">Active</div>
              <Link href="/dashboard/settings" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
                Manage account →
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Order History - Always visible */}
        <Link href="/dashboard/orders">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Order History</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                View all your past purchases and track order status
              </p>
              <Button variant="outline" className="w-full">
                View Orders <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Messages - Always visible */}
        <Link href="/dashboard/messages">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>Messages</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Contact support and view responses from our team
              </p>
              <Button variant="outline" className="w-full">
                View Messages <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Resources - Only visible if confirmed certification */}
        {hasConfirmedCertification && (
          <Link href="/dashboard/resources">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FileDown className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>Resources</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Download media files, documents, and PDFs
                </p>
                <Button variant="outline" className="w-full">
                  Browse Resources <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Settings - Always visible */}
        <Link href="/dashboard/settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Manage your account information and preferences
              </p>
              <Button variant="outline" className="w-full">
                Go to Settings <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Affiliate Program - Only visible if confirmed certification */}
        {hasConfirmedCertification && (
          <Link href="/dashboard/affiliate">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle>Affiliate Program</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Track your affiliate referrals and earnings
                </p>
                <Button variant="outline" className="w-full">
                  View Program <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Blog - Always visible */}
        <Link href="/dashboard/blog">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <BookOpen className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <CardTitle>Blog</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Read the latest articles and updates
              </p>
              <Button variant="outline" className="w-full">
                Read Blog <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* My Salon - Visible to all users */}
        <Link href="/dashboard/salon">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <MapPin className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>My Salon</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create and manage your salon listing
              </p>
              <Button variant="outline" className="w-full">
                Manage Salon <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders - Always visible */}
      {recentOrders.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Recent Orders</h2>
            <Link href="/dashboard/orders">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(order.total)}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {order.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

