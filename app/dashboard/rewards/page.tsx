"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Award, Coins, Loader2, History, Gift, Tag } from "lucide-react";
import Link from "next/link";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  discountType: string;
  discountValue: number;
}

interface PointsBalance {
  pointsBalance: number;
  pointsThisMonth: number;
  totalEarnings: number;
}

export default function RewardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [pointsBalance, setPointsBalance] = useState<PointsBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      fetchRewards();
      fetchPointsBalance();
    }
  }, [session, status, router]);

  const fetchRewards = async () => {
    try {
      const res = await fetch("/api/rewards");
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
      }
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPointsBalance = async () => {
    try {
      // Add timestamp to prevent caching and ensure fresh data
      const res = await fetch(`/api/affiliate?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPointsBalance({
          pointsBalance: data.pointsBalance || 0,
          pointsThisMonth: data.pointsThisMonth || 0,
          totalEarnings: data.totalEarnings || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch points balance:", error);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    if (!pointsBalance) return;
    
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    if (pointsBalance.pointsBalance < reward.pointsCost) {
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
        
        // Update points balance immediately (optimistic update)
        if (pointsBalance) {
          setPointsBalance({
            ...pointsBalance,
            pointsBalance: Math.max(0, pointsBalance.pointsBalance - reward.pointsCost),
          });
        }
        
        // Refresh data from server to get accurate values
        try {
          await Promise.all([
            fetchPointsBalance(),
            fetchRewards(),
          ]);
        } catch (err) {
          console.error("Failed to refresh data:", err);
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
          <p className="text-gray-600 dark:text-gray-400">Please log in to access rewards.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Rewards Catalog</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Redeem your points for discount coupons
        </p>
      </div>

      {/* Points Balance Card */}
      {pointsBalance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Points Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pointsBalance.pointsBalance.toLocaleString()}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Available to redeem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Gift className="h-4 w-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pointsBalance.pointsThisMonth.toLocaleString()}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Points earned this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Lifetime Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pointsBalance.totalEarnings.toLocaleString()}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Total points earned
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rewards Grid */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Available Rewards
            </CardTitle>
            <div className="flex gap-2">
              <Link href="/dashboard/coupons">
                <Button variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-2" />
                  My Coupons
                </Button>
              </Link>
              <Link href="/dashboard/points-history">
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No rewards available at the moment</p>
              <p className="text-sm text-gray-400">Check back later for new rewards!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{reward.name}</h3>
                    <Award className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  </div>
                  {reward.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{reward.description}</p>
                  )}
                  <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium">
                      <Coins className="h-4 w-4 inline mr-1" />
                      {reward.pointsCost.toLocaleString()} pts
                    </span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {reward.discountType === "PERCENTAGE"
                        ? `${reward.discountValue}% off`
                        : `€${Number(reward.discountValue).toFixed(2)} off`}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleRedeem(reward.id)}
                    disabled={!pointsBalance || pointsBalance.pointsBalance < reward.pointsCost || redeeming === reward.id}
                  >
                    {redeeming === reward.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Redeeming...
                      </>
                    ) : pointsBalance && pointsBalance.pointsBalance < reward.pointsCost ? (
                      "Insufficient Points"
                    ) : (
                      "Redeem Reward"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How Rewards Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Earn Points</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Earn points through purchases, referrals, and affiliate activities.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">Redeem Rewards</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use your points to redeem discount coupons from our rewards catalog.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">Use Your Coupon</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Apply your coupon code at checkout to receive your discount.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

