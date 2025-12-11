"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MousePointerClick, Users, TrendingUp, Target } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface AnalyticsData {
  totalClicks: number;
  convertedClicks: number;
  conversionRate: number;
  clicksOverTime: { date: string; total: number; converted: number }[];
  funnel: {
    clicks: number;
    registrations: number;
    referrals: number;
    activeReferrals: number;
  };
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session) {
      fetchAnalytics();
    }
  }, [session, status, router]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/affiliate/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Failed to load analytics");
        console.error("Failed to fetch analytics:", errorData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load analytics";
      setError(errorMessage);
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Failed to load analytics</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || "Unable to fetch analytics data. Please try again."}
          </p>
          <Button onClick={fetchAnalytics} variant="outline">
            <Loader2 className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Format dates for chart
  const formattedClicksData = analytics.clicksOverTime.map((item) => {
    const date = new Date(item.date);
    return {
      ...item,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });

  return (
    <div>
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-4xl font-bold mb-2">Referral Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your affiliate link performance and conversions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalClicks.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Link clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.convertedClicks.toLocaleString()}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Clicks to registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.funnel.activeReferrals}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {analytics.funnel.referrals} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analytics.funnel.clicks}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Clicks</div>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex-1 text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {analytics.funnel.registrations}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Registrations</div>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex-1 text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {analytics.funnel.referrals}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Referrals</div>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex-1 text-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {analytics.funnel.activeReferrals}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clicks Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Clicks Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {formattedClicksData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No click data available yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formattedClicksData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [value, value === 1 ? "Click" : "Clicks"]}
                  labelStyle={{ color: "#000" }}
                />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" name="Total Clicks" />
                <Bar dataKey="converted" fill="#10b981" name="Converted" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

