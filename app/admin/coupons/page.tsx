"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Tag,
  Copy,
  Filter,
  BarChart3,
  CheckSquare,
  Square,
  Trash2,
  Power,
  PowerOff,
  X,
} from "lucide-react";
import { formatPrice, handleApiError, showLoadingToast } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string;
  minPurchaseAmount: string | null;
  maxDiscountAmount: string | null;
  usageLimit: number | null;
  usedCount: number;
  userUsageLimit: number | null;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Analytics {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalUsage: number;
  totalDiscountGiven: string;
  mostUsedCoupons: Array<{
    code: string;
    usedCount: number;
    usageLimit: number | null;
    usagePercentage: number | null;
  }>;
  statusBreakdown: {
    active: number;
    inactive: number;
    expired: number;
    scheduled: number;
    limitReached: number;
  };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [selectedCoupons, setSelectedCoupons] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchCoupons();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    searchQuery,
    coupons,
    statusFilter,
    typeFilter,
    dateFilter,
    sortBy,
    sortOrder,
  ]);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      handleApiError(error, "load coupons");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch("/api/coupons/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      handleApiError(error, "load coupon analytics");
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...coupons];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (coupon) =>
          coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (coupon.description &&
            coupon.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((coupon) => {
        const now = new Date();
        switch (statusFilter) {
          case "active":
            return (
              coupon.isActive &&
              (!coupon.validFrom || new Date(coupon.validFrom) <= now) &&
              (!coupon.validUntil || new Date(coupon.validUntil) >= now) &&
              (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)
            );
          case "inactive":
            return !coupon.isActive;
          case "expired":
            return coupon.validUntil && new Date(coupon.validUntil) < now;
          case "scheduled":
            return coupon.validFrom && new Date(coupon.validFrom) > now;
          case "limitReached":
            return coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
          default:
            return true;
        }
      });
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (coupon) => coupon.discountType === typeFilter
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((coupon) => {
        switch (dateFilter) {
          case "today":
            const today = new Date(now.setHours(0, 0, 0, 0));
            return new Date(coupon.createdAt) >= today;
          case "week":
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            return new Date(coupon.createdAt) >= weekAgo;
          case "month":
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            return new Date(coupon.createdAt) >= monthAgo;
          case "expiringSoon":
            const weekFromNow = new Date(now.setDate(now.getDate() + 7));
            return (
              coupon.validUntil &&
              new Date(coupon.validUntil) <= weekFromNow &&
              new Date(coupon.validUntil) >= now
            );
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "code":
          aValue = a.code;
          bValue = b.code;
          break;
        case "usedCount":
          aValue = a.usedCount;
          bValue = b.usedCount;
          break;
        case "discountValue":
          aValue = Number(a.discountValue);
          bValue = Number(b.discountValue);
          break;
        case "validUntil":
          aValue = a.validUntil ? new Date(a.validUntil).getTime() : 0;
          bValue = b.validUntil ? new Date(b.validUntil).getTime() : 0;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredCoupons(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast("Coupon deleted successfully", "success");
        fetchCoupons();
        fetchAnalytics();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      handleApiError(error, "delete coupon");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/coupons/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeSuffix: "COPY" }),
      });

      if (res.ok) {
        toast("Coupon duplicated successfully", "success");
        fetchCoupons();
        fetchAnalytics();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to duplicate coupon:", error);
      handleApiError(error, "duplicate coupon");
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });

      if (res.ok) {
        toast(
          `Coupon ${coupon.isActive ? "deactivated" : "activated"} successfully`,
          "success"
        );
        fetchCoupons();
        fetchAnalytics();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to toggle coupon status:", error);
      handleApiError(error, "update coupon status");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCoupons.size === 0) {
      toast("Please select at least one coupon", "warning");
      return;
    }

    const actionText =
      action === "delete"
        ? "delete"
        : action === "activate"
        ? "activate"
        : "deactivate";

    if (
      !confirm(
        `Are you sure you want to ${actionText} ${selectedCoupons.size} coupon(s)?`
      )
    ) {
      return;
    }

    const loadingToastId = showLoadingToast(`Processing ${actionText} for ${selectedCoupons.size} coupon(s)...`);
    
    try {
      const res = await fetch("/api/coupons/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          couponIds: Array.from(selectedCoupons),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast(data.message || `Successfully ${actionText}d coupons`, "success");
        setSelectedCoupons(new Set());
        fetchCoupons();
        fetchAnalytics();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw { response: res, error: errorData.error };
      }
    } catch (error) {
      console.error("Failed to perform bulk action:", error);
      handleApiError(error, `${actionText} coupons`);
    }
  };

  const toggleSelectCoupon = (id: string) => {
    const newSelected = new Set(selectedCoupons);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCoupons(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCoupons.size === paginatedCoupons.length) {
      setSelectedCoupons(new Set());
    } else {
      setSelectedCoupons(
        new Set(paginatedCoupons.map((coupon) => coupon.id))
      );
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredCoupons.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedCoupons = filteredCoupons.slice(startIndex, endIndex);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "PERCENTAGE") {
      return `${coupon.discountValue}%`;
    } else {
      return formatPrice(coupon.discountValue);
    }
  };

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    if (!coupon.isActive) return "inactive";
    if (coupon.validUntil && new Date(coupon.validUntil) < now)
      return "expired";
    if (coupon.validFrom && new Date(coupon.validFrom) > now)
      return "scheduled";
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return "limitReached";
    return "active";
  };

  const getStatusBadge = (coupon: Coupon) => {
    const status = getCouponStatus(coupon);
    const badges = {
      active: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
      inactive: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
      expired: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
      scheduled:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      limitReached:
        "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    };

    const labels = {
      active: "Active",
      inactive: "Inactive",
      expired: "Expired",
      scheduled: "Scheduled",
      limitReached: "Limit Reached",
    };

    return (
      <span className={`text-xs px-2 py-1 rounded ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getUsagePercentage = (coupon: Coupon) => {
    if (!coupon.usageLimit) return null;
    return (coupon.usedCount / coupon.usageLimit) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Coupon List
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Sales{" "}
          <span className="mx-2">&gt;</span> Coupons
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && analytics && (
        <Card className="mb-6 bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Analytics Overview
              </h2>
              <button
                onClick={() => setShowAnalytics(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Coupons
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analytics.totalCoupons}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analytics.activeCoupons}
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Expired
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {analytics.expiredCoupons}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Usage
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {analytics.totalUsage}
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Discount Given
                </div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatPrice(analytics.totalDiscountGiven)}
                </div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Limit Reached
                </div>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {analytics.statusBreakdown.limitReached}
                </div>
              </div>
            </div>
            {analytics.mostUsedCoupons.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Most Used Coupons
                </h3>
                <div className="space-y-2">
                  {analytics.mostUsedCoupons.map((coupon) => (
                    <div
                      key={coupon.code}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {coupon.code}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {coupon.usedCount}
                          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                        </span>
                        {coupon.usagePercentage !== null && (
                          <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min(coupon.usagePercentage, 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Section */}
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              {/* Left side: Tip, Analytics, and Entries */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span>Tip: search by code or description</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAnalytics(!showAnalytics);
                    if (!analytics && !showAnalytics) {
                      fetchAnalytics();
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  {showAnalytics ? "Hide" : "Show"} Analytics
                </Button>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    Showing
                  </label>
                  <select
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10 entries</option>
                    <option value={25}>25 entries</option>
                    <option value={50}>50 entries</option>
                    <option value={100}>100 entries</option>
                  </select>
                </div>
              </div>

              {/* Right side: Search, Filter, and Add Button */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1 lg:flex-initial lg:max-w-2xl">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search here..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                <Link href="/admin/coupons/new" className="flex-shrink-0">
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    + Add new
                  </Button>
                </Link>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="limitReached">Limit Reached</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">All Types</option>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date Range
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="expiringSoon">Expiring Soon (7 days)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="code">Code</option>
                    <option value="usedCount">Usage Count</option>
                    <option value="discountValue">Discount Value</option>
                    <option value="validUntil">Expiry Date</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value as "asc" | "desc")
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedCoupons.size > 0 && (
              <div className="border-t pt-4 mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCoupons.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("activate")}
                  className="flex items-center gap-2"
                >
                  <Power className="h-4 w-4" />
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("deactivate")}
                  className="flex items-center gap-2"
                >
                  <PowerOff className="h-4 w-4" />
                  Deactivate
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCoupons(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card className="bg-white dark:bg-gray-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center"
                    >
                      {selectedCoupons.size === paginatedCoupons.length &&
                      paginatedCoupons.length > 0 ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Valid Until
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
                {paginatedCoupons.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      No coupons found
                    </td>
                  </tr>
                ) : (
                  paginatedCoupons.map((coupon) => {
                    const usagePercentage = getUsagePercentage(coupon);
                    return (
                      <tr
                        key={coupon.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {/* Checkbox */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleSelectCoupon(coupon.id)}
                            className="flex items-center"
                          >
                            {selectedCoupons.has(coupon.id) ? (
                              <CheckSquare className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </td>

                        {/* Code */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {coupon.code}
                            </span>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {coupon.description || "-"}
                          </span>
                        </td>

                        {/* Discount */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatDiscount(coupon)}
                          </span>
                        </td>

                        {/* Usage with Progress Bar */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {coupon.usedCount}
                                {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                              </span>
                            </div>
                            {usagePercentage !== null && (
                              <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    usagePercentage >= 100
                                      ? "bg-red-500"
                                      : usagePercentage >= 75
                                      ? "bg-orange-500"
                                      : "bg-blue-500"
                                  }`}
                                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Valid Until */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {coupon.validUntil
                              ? formatDate(coupon.validUntil)
                              : "No expiry"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(coupon)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/coupons/${coupon.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                Edit
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleDuplicate(coupon.id)}
                              title="Duplicate coupon"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleDelete(coupon.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredCoupons.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCoupons.length)} of {filteredCoupons.length} entries
                </div>
                <div className="flex items-center gap-2 mx-auto sm:mx-0">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, idx, arr) => (
                      <div key={page} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400 dark:text-gray-500">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                        {idx < arr.length - 1 &&
                          arr[idx + 1] !== page + 1 && (
                            <span className="px-2 text-gray-400 dark:text-gray-500">
                              ...
                            </span>
                          )}
                      </div>
                    ))}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
