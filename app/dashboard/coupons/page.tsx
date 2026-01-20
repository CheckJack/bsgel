"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Copy, Check, Loader2, Tag, Calendar, Gift, XCircle, CheckCircle2, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface Redemption {
  id: string;
  couponCode: string;
  pointsSpent: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  reward: {
    id: string;
    name: string;
    description: string | null;
    discountType: string;
    discountValue: number;
  };
  coupon: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    minPurchaseAmount: number | null;
    maxDiscountAmount: number | null;
    validFrom: string;
    validUntil: string | null;
    isActive: boolean;
    usedCount: number;
    usageLimit: number | null;
    description: string | null;
    isValid: boolean;
    isExpired: boolean;
    isUsed: boolean;
  };
}

export default function MyCouponsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFeatureSettings, setIsLoadingFeatureSettings] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [featureSettings, setFeatureSettings] = useState<{
    rewardsEnabled: boolean;
    affiliateEnabled: boolean;
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      fetchFeatureSettings();
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!featureSettings) return;
    
    if (!featureSettings.rewardsEnabled && session) {
      router.push("/dashboard");
      return;
    }
    
    if (featureSettings.rewardsEnabled && session) {
      fetchCoupons();
    }
  }, [featureSettings?.rewardsEnabled, session, router, statusFilter]);

  const fetchFeatureSettings = async () => {
    try {
      setIsLoadingFeatureSettings(true);
      // Use fetch with cache for better performance
      const res = await fetch("/api/admin/feature-settings", {
        next: { revalidate: 30 }, // Cache for 30 seconds
      });
      if (res.ok) {
        const data = await res.json();
        setFeatureSettings({
          rewardsEnabled: data.rewardsEnabled ?? true,
          affiliateEnabled: data.affiliateEnabled ?? true,
        });
      }
    } catch (error) {
      console.error("Failed to fetch feature settings:", error);
      setFeatureSettings({ rewardsEnabled: false, affiliateEnabled: false });
    } finally {
      setIsLoadingFeatureSettings(false);
    }
  };

  // Refresh coupons when page becomes visible or focused (e.g., when navigating to this page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && session) {
        fetchCoupons();
      }
    };

    const handleFocus = () => {
      if (session) {
        fetchCoupons();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [session]);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      // Always fetch all coupons, then filter client-side if needed
      const params = `?status=all&t=${Date.now()}`;
      const res = await fetch(`/api/rewards/my-coupons${params}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`Loaded ${data.redemptions?.length || 0} coupons from API`);
        setRedemptions(data.redemptions || []);
      } else {
        const error = await res.json();
        console.error("Failed to load coupons:", error);
        toast(error.error || t("clientPanel.coupons.failedToLoad"), "error");
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      toast(t("clientPanel.coupons.failedToLoadRetry"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast(t("clientPanel.coupons.couponCopied"), "success");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (redemption: Redemption) => {
    if (redemption.coupon.isUsed) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {t("clientPanel.coupons.statusUsed")}
        </span>
      );
    }
    if (redemption.coupon.isExpired) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          {t("clientPanel.coupons.statusExpired")}
        </span>
      );
    }
    if (redemption.coupon.isValid) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {t("clientPanel.coupons.statusActive")}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {t("clientPanel.coupons.statusPending")}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Show loading while checking feature settings
  if (isLoadingFeatureSettings || !featureSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Redirect if rewards disabled
  if (!featureSettings.rewardsEnabled) {
    return null; // Will redirect in useEffect
  }

  if (!session) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">{t("clientPanel.coupons.pleaseLogin")}</p>
          </div>
        </div>
      );
  }

  // Filter coupons based on status filter
  const filteredRedemptions = statusFilter === "all" 
    ? redemptions 
    : statusFilter === "active"
    ? redemptions.filter((r) => r.coupon.isValid && !r.coupon.isUsed)
    : statusFilter === "used"
    ? redemptions.filter((r) => r.coupon.isUsed)
    : redemptions.filter((r) => r.coupon.isExpired && !r.coupon.isUsed);

  const activeCoupons = redemptions.filter((r) => r.coupon.isValid && !r.coupon.isUsed);
  const usedCoupons = redemptions.filter((r) => r.coupon.isUsed);
  const expiredCoupons = redemptions.filter((r) => r.coupon.isExpired && !r.coupon.isUsed);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t("clientPanel.coupons.title")}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t("clientPanel.coupons.description")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {t("clientPanel.coupons.activeCoupons")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {activeCoupons.length}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t("clientPanel.coupons.readyToUse")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Gift className="h-4 w-4" />
              {t("clientPanel.coupons.usedCoupons")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
              {usedCoupons.length}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t("clientPanel.coupons.alreadyApplied")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              {t("clientPanel.coupons.expiredCoupons")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {expiredCoupons.length}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t("clientPanel.coupons.noLongerValid")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "all"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          {t("clientPanel.coupons.all")} ({redemptions.length})
        </button>
        <button
          onClick={() => setStatusFilter("active")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "active"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          {t("clientPanel.coupons.active")} ({activeCoupons.length})
        </button>
        <button
          onClick={() => setStatusFilter("used")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "used"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          {t("clientPanel.coupons.used")} ({usedCoupons.length})
        </button>
        <button
          onClick={() => setStatusFilter("expired")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === "expired"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          {t("clientPanel.coupons.expired")} ({expiredCoupons.length})
        </button>
      </div>

      {/* Coupons List */}
      {filteredRedemptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">{t("clientPanel.coupons.noCouponsYet")}</p>
            <p className="text-sm text-gray-400 mb-4">
              {t("clientPanel.coupons.redeemRewards")}
            </p>
            <Button onClick={() => router.push("/dashboard/rewards")} variant="outline">
              {t("clientPanel.coupons.browseRewards")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRedemptions.map((redemption) => (
            <Card
              key={redemption.id}
              className={`${
                redemption.coupon.isValid && !redemption.coupon.isUsed
                  ? "border-green-200 dark:border-green-800"
                  : redemption.coupon.isUsed
                  ? "border-gray-200 dark:border-gray-700 opacity-75"
                  : "border-red-200 dark:border-red-800 opacity-75"
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{redemption.reward.name}</CardTitle>
                  {getStatusBadge(redemption)}
                </div>
                {redemption.reward.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {redemption.reward.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coupon Code */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t("clientPanel.coupons.couponCode")}
                      </p>
                      <p className="text-xl font-bold font-mono">
                        {redemption.couponCode}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(redemption.couponCode)}
                      disabled={redemption.coupon.isUsed || redemption.coupon.isExpired}
                    >
                      {copiedCode === redemption.couponCode ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          {t("clientPanel.coupons.copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          {t("clientPanel.coupons.copy")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Discount Info */}
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm font-medium">{t("clientPanel.coupons.discount")}</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {redemption.coupon.discountType === "PERCENTAGE"
                      ? `${redemption.coupon.discountValue}% off`
                      : `€${Number(redemption.coupon.discountValue).toFixed(2)} off`}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  {redemption.coupon.minPurchaseAmount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t("clientPanel.coupons.minPurchase")}</span>
                      <span className="font-medium">
                        €{Number(redemption.coupon.minPurchaseAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {redemption.coupon.maxDiscountAmount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t("clientPanel.coupons.maxDiscount")}</span>
                      <span className="font-medium">
                        €{Number(redemption.coupon.maxDiscountAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("clientPanel.coupons.validFrom")}</span>
                    <span className="font-medium">{formatDate(redemption.coupon.validFrom)}</span>
                  </div>
                  {redemption.coupon.validUntil && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t("clientPanel.coupons.validUntil")}</span>
                      <span className="font-medium">
                        {formatDate(redemption.coupon.validUntil)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("clientPanel.coupons.pointsSpent")}</span>
                    <span className="font-medium">{redemption.pointsSpent.toLocaleString()} pts</span>
                  </div>
                  {redemption.coupon.isUsed && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t("clientPanel.coupons.usedLabel")}</span>
                      <span className="font-medium">
                        {redemption.coupon.usedCount} {redemption.coupon.usedCount !== 1 ? t("clientPanel.coupons.timesPlural") : t("clientPanel.coupons.times")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {redemption.coupon.isValid && !redemption.coupon.isUsed && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      copyToClipboard(redemption.couponCode);
                      router.push("/products");
                    }}
                  >
                    {t("clientPanel.coupons.useCoupon")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

