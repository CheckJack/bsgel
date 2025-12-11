"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Users, CheckCircle, Clock, XCircle, TrendingUp, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Referral {
  id: string;
  status: string;
  referralDate: string;
  createdAt: string;
  firstOrderId: string | null;
  referredUser: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
  totalOrders: number;
  totalRevenue: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
}

export default function ReferralsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "PENDING" | "ACTIVE" | "INACTIVE">("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      fetchReferrals();
    }
  }, [session, status, router]);

  const fetchReferrals = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/affiliate/referrals");
      if (res.ok) {
        const data = await res.json();
        setReferrals(data.referrals || []);
      }
    } catch (error) {
      console.error("Failed to fetch referrals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            <XCircle className="h-3 w-3" />
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const filteredReferrals = statusFilter === "all" 
    ? referrals 
    : referrals.filter(r => r.status === statusFilter);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-4xl font-bold mb-2">My Referrals</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View all users you've referred and their activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{referrals.length}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {referrals.filter(r => r.status === "ACTIVE").length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {referrals.reduce((sum, r) => sum + r.totalOrders, 0)}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              From all referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatPrice(referrals.reduce((sum, r) => sum + r.totalRevenue, 0))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Generated by referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {referrals.length > 0
                ? Math.round((referrals.filter(r => r.totalOrders > 0).length / referrals.length) * 100)
                : 0}%
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Referrals with orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "PENDING" ? "default" : "outline"}
              onClick={() => setStatusFilter("PENDING")}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === "ACTIVE" ? "default" : "outline"}
              onClick={() => setStatusFilter("ACTIVE")}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "INACTIVE" ? "default" : "outline"}
              onClick={() => setStatusFilter("INACTIVE")}
            >
              Inactive
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Referrals ({filteredReferrals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReferrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No referrals found</p>
              <p className="text-sm text-gray-400">
                {statusFilter === "all"
                  ? "Start sharing your affiliate link to get referrals!"
                  : `No ${statusFilter.toLowerCase()} referrals`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Referral Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Orders
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      First Order
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReferrals.map((referral) => (
                    <tr
                      key={referral.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {referral.referredUser.name || referral.referredUser.email.split("@")[0]}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {referral.referredUser.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(referral.status)}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(referral.referralDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{referral.totalOrders}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{formatPrice(referral.totalRevenue)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {referral.firstOrderDate
                          ? new Date(referral.firstOrderDate).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

