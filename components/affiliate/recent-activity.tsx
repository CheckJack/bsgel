"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Coins, Gift, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ActivityItem {
  type: "referral" | "points" | "redemption";
  description: string;
  date: string;
  amount?: number;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "referral":
        return <Users className="h-4 w-4" />;
      case "points":
        return <Coins className="h-4 w-4" />;
      case "redemption":
        return <Gift className="h-4 w-4" />;
      default:
        return <ShoppingBag className="h-4 w-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "referral":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      case "points":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
      case "redemption":
        return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getColor(
                    activity.type
                  )}`}
                >
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activity.description}
                  </p>
                  {activity.amount !== undefined && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.amount > 0 ? "+" : ""}
                      {activity.type === "points"
                        ? `${activity.amount.toLocaleString()} points`
                        : formatPrice(activity.amount)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(activity.date).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

