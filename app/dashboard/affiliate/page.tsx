"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Users, Coins, Link as LinkIcon, Copy, Check, Loader2, Award, Gift, History, TrendingUp } from "lucide-react";
import Link from "next/link";
import { EarningsChart } from "@/components/affiliate/earnings-chart";
import { ReferralsChart } from "@/components/affiliate/referrals-chart";
import { RecentActivity } from "@/components/affiliate/recent-activity";
import { formatPrice } from "@/lib/utils";

interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  pointsBalance: number;
  pointsThisMonth: number;
  affiliateCode: string;
  affiliateLink: string;
  commissionRate: number;
  tier?: string;
  tierBenefits?: {
    commissionBonus: number;
    description: string;
  };
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  discountType: string;
  discountValue: number;
}

export default function AffiliatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [earningsData, setEarningsData] = useState<{ period: string; points: number }[]>([]);
  const [referralsData, setReferralsData] = useState<{ month: string; total: number; active: number }[]>([]);
  const [topReferrals, setTopReferrals] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [earningsPeriod, setEarningsPeriod] = useState<"month" | "year">("month");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      // Affiliate program is open to all customers
      fetchAffiliateData();
      fetchRewards();
      fetchEarningsBreakdown();
      fetchReferralsStats();
      fetchTopReferrals();
      fetchRecentActivity();
    }
  }, [session, status, router]);

  const fetchAffiliateData = async () => {
    try {
      // Add timestamp to prevent caching
      const res = await fetch(`/api/affiliate?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const error = await res.json();
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        toast(error.error || "Failed to load affiliate data", "error");
      }
    } catch (error) {
      console.error("Failed to fetch affiliate data:", error);
      toast("Failed to load affiliate data. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRewards = async () => {
    try {
      const res = await fetch("/api/rewards");
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
      }
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
    }
  };

  const fetchEarningsBreakdown = async () => {
    try {
      const res = await fetch(`/api/affiliate/earnings-breakdown?period=${earningsPeriod}`);
      if (res.ok) {
        const data = await res.json();
        setEarningsData(data.breakdown || []);
      }
    } catch (error) {
      console.error("Failed to fetch earnings breakdown:", error);
    }
  };

  const fetchReferralsStats = async () => {
    try {
      const res = await fetch("/api/affiliate/referrals-stats");
      if (res.ok) {
        const data = await res.json();
        setReferralsData(data.stats || []);
      }
    } catch (error) {
      console.error("Failed to fetch referrals stats:", error);
    }
  };

  const fetchTopReferrals = async () => {
    try {
      const res = await fetch("/api/affiliate/top-referrals?limit=5");
      if (res.ok) {
        const data = await res.json();
        setTopReferrals(data.referrals || []);
      }
    } catch (error) {
      console.error("Failed to fetch top referrals:", error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent points transactions and redemptions
      const [transactionsRes, redemptionsRes, referralsRes] = await Promise.all([
        fetch("/api/points/transactions?perPage=5"),
        fetch("/api/rewards/my-coupons?status=all"),
        fetch("/api/affiliate/referrals"),
      ]);

      const activities: any[] = [];

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        const transactions = transactionsData.transactions || [];
        transactions.slice(0, 3).forEach((t: any) => {
          activities.push({
            type: "points",
            description: t.description || `Points ${t.amount > 0 ? "earned" : "spent"}`,
            date: t.createdAt,
            amount: t.amount,
          });
        });
      }

      if (redemptionsRes.ok) {
        const redemptionsData = await redemptionsRes.json();
        const redemptions = redemptionsData.redemptions || [];
        redemptions.slice(0, 2).forEach((r: any) => {
          activities.push({
            type: "redemption",
            description: `Redeemed: ${r.reward?.name || "Reward"}`,
            date: r.createdAt,
            amount: -r.pointsSpent,
          });
        });
      }

      if (referralsRes.ok) {
        const referralsData = await referralsRes.json();
        const referrals = referralsData.referrals || [];
        referrals.slice(0, 2).forEach((r: any) => {
          activities.push({
            type: "referral",
            description: `New referral: ${r.referredUser?.name || r.referredUser?.email || "User"}`,
            date: r.referralDate,
          });
        });
      }

      // Sort by date and take most recent 10
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 10));
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    if (!stats) return;
    
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;
    
    if (stats.pointsBalance < reward.pointsCost) {
      toast("Insufficient points", "error");
      return;
    }

    try {
      setRedeeming(rewardId);
      console.log("Redeeming reward:", rewardId);
      
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });

      const data = await res.json();
      console.log("Redemption response:", { ok: res.ok, data });

      if (res.ok && data.success) {
        // Show success toast immediately
        const couponCode = data.couponCode || "N/A";
        console.log("Showing toast with coupon code:", couponCode);
        toast(`Reward redeemed! Coupon code: ${couponCode}`, "success", 5000);
        
        // Update stats immediately (optimistic update)
        if (stats) {
          setStats({
            ...stats,
            pointsBalance: Math.max(0, stats.pointsBalance - reward.pointsCost),
          });
        }
        
        // Refresh data from server to get accurate values
        try {
          await fetchAffiliateData();
        } catch (err) {
          console.error("Failed to refresh affiliate data:", err);
        }
        
        // Redirect to my coupons page after a brief delay to allow toast to show
        setTimeout(() => {
          console.log("Redirecting to coupons page");
          router.push("/dashboard/coupons");
          router.refresh(); // Force Next.js to refresh server components
        }, 2000);
      } else {
        const errorMessage = data.error || "Failed to redeem reward";
        console.error("Redemption failed:", errorMessage);
        toast(errorMessage, "error", 5000);
        setRedeeming(null);
      }
    } catch (error) {
      console.error("Failed to redeem reward:", error);
      toast("Failed to redeem reward. Please try again.", "error", 5000);
      setRedeeming(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Please log in to access the affiliate program.</p>
        </div>
      </div>
    );
  }

  if (!stats && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Failed to load affiliate data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please refresh the page or contact support if the problem persists.</p>
          <Button onClick={() => { fetchAffiliateData(); fetchRewards(); }} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Affiliate Program</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your referrals and earnings from the affiliate program
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalReferrals}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {stats.activeReferrals} active
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
            <div className="text-3xl font-bold">{stats.pointsBalance.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {stats.pointsThisMonth.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Affiliate Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.affiliateCode}</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => copyToClipboard(stats.affiliateCode)}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Lifetime Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalEarnings.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Total points earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Badge */}
      {stats.tier && stats.tierBenefits && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Your Tier: {stats.tier}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {stats.tierBenefits.description}
                </p>
                {stats.tierBenefits.commissionBonus > 0 && (
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    +{stats.tierBenefits.commissionBonus}% commission bonus
                  </p>
                )}
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  stats.tier === "BRONZE"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    : stats.tier === "SILVER"
                    ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                    : stats.tier === "GOLD"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                }`}
              >
                {stats.tier}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Affiliate Link */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Your Affiliate Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Share this link:</p>
              <p className="text-sm font-mono break-all">{stats.affiliateLink}</p>
            </div>
            <Button
              onClick={() => copyToClipboard(stats.affiliateLink)}
              className="md:w-auto"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <EarningsChart data={earningsData} period={earningsPeriod} />
        <ReferralsChart data={referralsData} />
      </div>

      {/* Top Referrals and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Referrals */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Referrals
              </CardTitle>
              <Link href="/dashboard/affiliates/referrals">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {topReferrals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No referrals yet</p>
            ) : (
              <div className="space-y-3">
                {topReferrals.map((referral, index) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {referral.referredUser?.name || referral.referredUser?.email?.split("@")[0] || "User"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {referral.totalOrders} orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatPrice(referral.totalRevenue)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <RecentActivity activities={recentActivity} />
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Share Your Link</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share your unique affiliate link with friends, family, or on social media.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">They Make a Purchase</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When someone uses your link to make a purchase, they become your referral.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">You Earn Points</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You earn points for every referral and purchase. Use your points to redeem discount coupons from our rewards catalog.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Catalog */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Rewards Catalog
            </CardTitle>
            <Link href="/dashboard/points-history">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No rewards available at the moment</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <h3 className="font-semibold mb-2">{reward.name}</h3>
                  {reward.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{reward.description}</p>
                  )}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm">
                      <span className="font-medium">{reward.pointsCost.toLocaleString()} pts</span>
                    </span>
                    <span className="text-sm font-medium">
                      {reward.discountType === "PERCENTAGE"
                        ? `${reward.discountValue}% off`
                        : `€${Number(reward.discountValue).toFixed(2)} off`}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleRedeem(reward.id)}
                    disabled={!stats || stats.pointsBalance < reward.pointsCost || redeeming === reward.id}
                  >
                    {redeeming === reward.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Redeeming...
                      </>
                    ) : stats && stats.pointsBalance < reward.pointsCost ? (
                      "Insufficient Points"
                    ) : (
                      "Redeem"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

