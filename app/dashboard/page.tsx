"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, FileDown, Settings, Users, BookOpen, MapPin, MessageCircle, ArrowRight, Award, Coins, TrendingUp, Sparkles, Gift } from "lucide-react";

interface Order {
  id: string;
  total: string;
  status: string;
  createdAt: string;
}

interface PointsData {
  pointsBalance: number;
  pointsThisMonth: number;
  totalEarnings: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      fetchOrders();
      fetchPointsData();
    }
  }, [session, status, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?limit=10");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || data);
      } else {
        const error = await res.json();
        console.error("Failed to fetch orders:", error);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPointsData = async () => {
    try {
      const res = await fetch("/api/affiliate");
      if (res.ok) {
        const data = await res.json();
        setPointsData({
          pointsBalance: data.pointsBalance || 0,
          pointsThisMonth: data.pointsThisMonth || 0,
          totalEarnings: data.totalEarnings || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch points data:", error);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
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
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Welcome back, {session.user?.name || session.user?.email?.split("@")[0] || "User"}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
              Here&apos;s an overview of your account activity
            </p>
          </div>
          <Link href="/dashboard/rewards" className="self-start sm:self-auto">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all text-sm sm:text-base">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              My Rewards
            </Button>
          </Link>
        </div>
        {isPendingCertification && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg animate-pulse">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Your certification is pending confirmation. Once confirmed, you&apos;ll have access to all dashboard features.
            </p>
          </div>
        )}
      </div>

      {/* Rewards/Points Card - Professional Design */}
      {pointsData && (
        <Link href="/dashboard/rewards">
          <Card className="relative overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-xl group cursor-pointer bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-500"></div>
            <CardContent className="relative p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl group-hover:scale-105 transition-transform duration-300">
                    <Coins className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 uppercase tracking-wide">Rewards Balance</p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-1">
                      {pointsData.pointsBalance.toLocaleString()}
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                      {pointsData.pointsThisMonth > 0 && (
                        <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          +{pointsData.pointsThisMonth.toLocaleString()} this month
                        </span>
                      )}
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Lifetime: {pointsData.totalEarnings.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg group-hover:shadow-xl transition-all px-4 sm:px-6 py-3 sm:py-4 md:py-6 text-sm sm:text-base w-full sm:w-auto">
                    Redeem Rewards
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Account Statistics - Modern Design */}
      {(hasConfirmedCertification || !isPendingCertification) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Link href="/dashboard/orders" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  View all →
                </Link>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">All time purchases</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{formatPrice(totalSpent.toString())}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Lifetime value</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <Link href="/dashboard/settings" className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Manage →
                </Link>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">Active</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Account in good standing</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Orders - Always visible */}
      {recentOrders.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
            <Link href="/dashboard/orders">
              <Button variant="outline" className="hover:bg-gray-100 dark:hover:bg-gray-800 text-sm sm:text-base w-full sm:w-auto">
                View All
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-blue-500">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase">
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(order.total)}
                    </p>
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

