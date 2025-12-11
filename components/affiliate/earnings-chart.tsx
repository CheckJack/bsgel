"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface EarningsData {
  period: string;
  points: number;
}

interface EarningsChartProps {
  data: EarningsData[];
  period: "month" | "year";
}

export function EarningsChart({ data, period }: EarningsChartProps) {
  // Format period labels
  const formattedData = data.map((item) => {
    let label = item.period;
    if (period === "month") {
      const [year, month] = item.period.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    return {
      ...item,
      label,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No earnings data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedData}>
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
                formatter={(value: number) => [`${value.toLocaleString()} pts`, "Points"]}
                labelStyle={{ color: "#000" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="points"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Points Earned"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

