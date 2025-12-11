"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ReferralsData {
  month: string;
  total: number;
  active: number;
}

interface ReferralsChartProps {
  data: ReferralsData[];
}

export function ReferralsChart({ data }: ReferralsChartProps) {
  // Format month labels
  const formattedData = data.map((item) => {
    const [year, month] = item.month.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return {
      ...item,
      label,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referrals Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No referrals data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formattedData}>
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
                formatter={(value: number) => [value, value === 1 ? "Referral" : "Referrals"]}
                labelStyle={{ color: "#000" }}
              />
              <Legend />
              <Bar dataKey="total" fill="#3b82f6" name="Total Referrals" />
              <Bar dataKey="active" fill="#10b981" name="Active Referrals" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

