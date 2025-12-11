"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, X, Eye, Award } from "lucide-react";
import Link from "next/link";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  discountType: string;
  discountValue: number;
  minPurchaseAmount: number | null;
  maxDiscountAmount: number | null;
  isActive: boolean;
  stock: number | null;
  redeemedCount: number;
  validFrom: string;
  validUntil: string | null;
  redemptionCount?: number;
}

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/rewards");
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reward?")) return;

    try {
      const res = await fetch(`/api/admin/rewards/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchRewards();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete reward");
      }
    } catch (error) {
      console.error("Failed to delete reward:", error);
    }
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Rewards Catalog</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage discount rewards purchasable with points</p>
        </div>
        <Link href="/admin/rewards/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Reward
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => (
          <Card key={reward.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  {reward.name}
                </CardTitle>
                {reward.isActive ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                    Inactive
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{reward.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Points Cost:</span>
                  <span className="font-medium">{reward.pointsCost.toLocaleString()} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Discount:</span>
                  <span className="font-medium">
                    {reward.discountType === "PERCENTAGE"
                      ? `${reward.discountValue}%`
                      : `€${Number(reward.discountValue).toFixed(2)}`}
                  </span>
                </div>
                {reward.stock !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Stock:</span>
                    <span className="font-medium">
                      {reward.stock - reward.redeemedCount} / {reward.stock}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Redemptions:</span>
                  <span className="font-medium">{reward.redemptionCount || reward.redeemedCount}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/admin/rewards/${reward.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => handleDelete(reward.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rewards.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No rewards yet. Create one to get started.</p>
            <Link href="/admin/rewards/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Reward
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

