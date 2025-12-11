"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Eye, CheckCircle, XCircle, TrendingUp, Users, Coins, Award } from "lucide-react";
import Link from "next/link";

interface Affiliate {
  id: string;
  affiliateCode: string;
  isActive: boolean;
  totalPointsEarned: number;
  currentPointsBalance: number;
  totalReferrals: number;
  activeReferrals: number;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
  approvedAt: string | null;
  createdAt: string;
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalPointsIssued: 0,
    totalPointsRedeemed: 0,
  });

  useEffect(() => {
    fetchAffiliates();
    fetchStats();
  }, [currentPage, statusFilter]);

  const fetchStats = async () => {
    try {
      const [affiliatesRes, transactionsRes] = await Promise.all([
        fetch("/api/admin/affiliates"),
        fetch("/api/admin/points-transactions"),
      ]);

      if (affiliatesRes.ok) {
        const data = await affiliatesRes.json();
        const allAffiliates = data.affiliates || [];
        setStats({
          totalAffiliates: allAffiliates.length,
          activeAffiliates: allAffiliates.filter((a: Affiliate) => a.isActive).length,
          totalPointsIssued: 0, // Will be calculated from transactions
          totalPointsRedeemed: 0,
        });
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        const transactions = data.transactions || [];
        const issued = transactions
          .filter((t: any) => t.amount > 0)
          .reduce((sum: number, t: any) => sum + t.amount, 0);
        const redeemed = Math.abs(
          transactions
            .filter((t: any) => t.amount < 0 && t.type === "REDEMPTION")
            .reduce((sum: number, t: any) => sum + t.amount, 0)
        );
        setStats((prev) => ({
          ...prev,
          totalPointsIssued: issued,
          totalPointsRedeemed: redeemed,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchAffiliates = async () => {
    try {
      setIsLoading(true);
      const status = statusFilter === "all" ? null : statusFilter;
      const url = `/api/admin/affiliates?page=${currentPage}&perPage=20${status ? `&status=${status}` : ""}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAffiliates(data.affiliates || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch affiliates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchAffiliates();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleToggleStatus = async (affiliate: Affiliate) => {
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !affiliate.isActive,
        }),
      });

      if (res.ok) {
        fetchAffiliates();
      }
    } catch (error) {
      console.error("Failed to update affiliate:", error);
    }
  };

  if (isLoading && affiliates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Affiliates Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage affiliate accounts and track performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Affiliates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAffiliates}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {stats.activeAffiliates} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Points Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPointsIssued.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Points Redeemed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPointsRedeemed.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              For rewards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Net Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(stats.totalPointsIssued - stats.totalPointsRedeemed).toLocaleString()}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Outstanding balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search affiliates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "default" : "outline"}
                onClick={() => setStatusFilter("inactive")}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Affiliate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Referrals
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No affiliates found
                    </td>
                  </tr>
                ) : (
                  affiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {affiliate.user.name?.[0] || affiliate.user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {affiliate.user.name || affiliate.user.email.split("@")[0]}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {affiliate.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {affiliate.affiliateCode}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{affiliate.totalReferrals}</p>
                          <p className="text-sm text-gray-500">
                            {affiliate.activeReferrals} active
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{affiliate.currentPointsBalance.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">
                            {affiliate.totalPointsEarned.toLocaleString()} earned
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {affiliate.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/affiliates/${affiliate.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(affiliate)}
                          >
                            {affiliate.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

