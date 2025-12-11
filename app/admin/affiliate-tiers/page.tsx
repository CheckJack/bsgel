"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Save, RefreshCw, Users, Award, TrendingUp } from "lucide-react";

interface TierConfig {
  tier: string;
  totalReferrals: number;
  totalPointsEarned: number;
  activeReferrals: number;
}

interface TierDistribution {
  BRONZE: number;
  SILVER: number;
  GOLD: number;
  PLATINUM: number;
}

export default function AffiliateTiersPage() {
  const [tierConfigs, setTierConfigs] = useState<TierConfig[]>([
    { tier: "BRONZE", totalReferrals: 0, totalPointsEarned: 0, activeReferrals: 0 },
    { tier: "SILVER", totalReferrals: 10, totalPointsEarned: 500, activeReferrals: 5 },
    { tier: "GOLD", totalReferrals: 50, totalPointsEarned: 2500, activeReferrals: 25 },
    { tier: "PLATINUM", totalReferrals: 200, totalPointsEarned: 10000, activeReferrals: 100 },
  ]);
  const [distribution, setDistribution] = useState<TierDistribution>({
    BRONZE: 0,
    SILVER: 0,
    GOLD: 0,
    PLATINUM: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDistribution();
  }, []);

  const fetchDistribution = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/affiliate-tiers/distribution");
      if (res.ok) {
        const data = await res.json();
        setDistribution(data);
      }
    } catch (error) {
      console.error("Failed to fetch tier distribution:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteAll = async () => {
    if (!confirm("This will recalculate and promote all affiliates to their appropriate tiers. Continue?")) {
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch("/api/admin/affiliate-tiers/promote-all", {
        method: "POST",
      });

      if (res.ok) {
        alert("All affiliates have been promoted to their appropriate tiers.");
        fetchDistribution();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to promote affiliates");
      }
    } catch (error) {
      console.error("Failed to promote affiliates:", error);
      alert("Failed to promote affiliates");
    } finally {
      setIsSaving(false);
    }
  };

  const tierColors: Record<string, string> = {
    BRONZE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    SILVER: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    GOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    PLATINUM: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };

  const tierIcons: Record<string, any> = {
    BRONZE: Award,
    SILVER: Award,
    GOLD: Award,
    PLATINUM: Award,
  };

  return (
    <div className="p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Affiliate Tiers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage affiliate tier system and thresholds
          </p>
        </div>
        <Button onClick={handlePromoteAll} disabled={isSaving}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isSaving ? "animate-spin" : ""}`} />
          {isSaving ? "Promoting..." : "Promote All Affiliates"}
        </Button>
      </div>

      {/* Tier Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {Object.entries(distribution).map(([tier, count]) => {
          const Icon = tierIcons[tier];
          return (
            <Card key={tier}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tier}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{count}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Affiliates
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tier Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tierConfigs.map((config, index) => (
              <div
                key={config.tier}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${tierColors[config.tier]}`}
                    >
                      {config.tier}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {index === 0 ? "Default tier" : `Requires all of:`}
                    </span>
                  </div>
                </div>
                {index > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Total Referrals
                      </label>
                      <Input
                        type="number"
                        value={config.totalReferrals}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Total Points Earned
                      </label>
                      <Input
                        type="number"
                        value={config.totalPointsEarned}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Active Referrals
                      </label>
                      <Input
                        type="number"
                        value={config.activeReferrals}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> Tier thresholds are currently hardcoded in the system. 
              Affiliates are automatically promoted when they meet all requirements for a tier.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

