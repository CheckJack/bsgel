"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, XCircle, TrendingUp, Users, Coins, Package, ArrowRight } from "lucide-react";

interface AffiliateDetails {
  id: string;
  affiliateCode: string;
  isActive: boolean;
  totalPointsEarned: number;
  currentPointsBalance: number;
  totalReferrals: number;
  activeReferrals: number;
  referralOrders: number;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    createdAt: string;
  };
  referrals: Array<{
    id: string;
    status: string;
    referralDate: string;
    referredUser: {
      id: string;
      email: string;
      name: string | null;
    };
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string | null;
    balanceAfter: number;
    createdAt: string;
  }>;
}

export default function AffiliateDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState<AffiliateDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pointsAdjustment, setPointsAdjustment] = useState("");
  const [pointsDescription, setPointsDescription] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchAffiliate();
    }
  }, [params.id]);

  const fetchAffiliate = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/affiliates/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setAffiliate(data);
      }
    } catch (error) {
      console.error("Failed to fetch affiliate:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePointsAdjustment = async () => {
    if (!pointsAdjustment || !affiliate) return;

    const amount = parseInt(pointsAdjustment);
    if (isNaN(amount) || amount === 0) return;

    try {
      setIsAdjusting(true);
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pointsAdjustment: amount,
          pointsDescription: pointsDescription || `Manual adjustment: ${amount > 0 ? "+" : ""}${amount} points`,
        }),
      });

      if (res.ok) {
        setPointsAdjustment("");
        setPointsDescription("");
        fetchAffiliate();
      }
    } catch (error) {
      console.error("Failed to adjust points:", error);
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!affiliate) return;

    try {
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !affiliate.isActive,
        }),
      });

      if (res.ok) {
        fetchAffiliate();
      }
    } catch (error) {
      console.error("Failed to update affiliate:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="p-6">
        <p>Affiliate not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Affiliate Details</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{affiliate.totalReferrals}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {affiliate.activeReferrals} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{affiliate.referralOrders}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              From referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Points Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{affiliate.currentPointsBalance.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {affiliate.totalPointsEarned.toLocaleString()} earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {affiliate.isActive ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <XCircle className="h-4 w-4" />
                Inactive
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              className="mt-2 w-full"
            >
              {affiliate.isActive ? "Deactivate" : "Activate"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* User Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Affiliate Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
              <p className="text-gray-900 dark:text-gray-100">{affiliate.user.name || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
              <p className="text-gray-900 dark:text-gray-100">{affiliate.user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Affiliate Code</label>
              <p className="text-gray-900 dark:text-gray-100 font-mono">{affiliate.affiliateCode}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</label>
              <p className="text-gray-900 dark:text-gray-100">
                {new Date(affiliate.user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points Adjustment */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manual Points Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="number"
              placeholder="Points amount (+/-)"
              value={pointsAdjustment}
              onChange={(e) => setPointsAdjustment(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Description (optional)"
              value={pointsDescription}
              onChange={(e) => setPointsDescription(e.target.value)}
            />
            <Button
              onClick={handlePointsAdjustment}
              disabled={!pointsAdjustment || isAdjusting}
            >
              {isAdjusting ? "Adjusting..." : "Adjust Points"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referrals */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Referrals ({affiliate.referrals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {affiliate.referrals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No referrals yet</p>
            ) : (
              affiliate.referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{referral.referredUser.name || referral.referredUser.email}</p>
                    <p className="text-sm text-gray-500">{referral.referredUser.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        referral.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {referral.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(referral.referralDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Points Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {affiliate.recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  affiliate.recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 text-sm">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">{transaction.type}</td>
                      <td className={`px-4 py-3 text-sm font-medium ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                        {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                      </td>
                      <td className="px-4 py-3 text-sm">{transaction.balanceAfter.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{transaction.description || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

