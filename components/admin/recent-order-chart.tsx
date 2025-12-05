"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart, ResponsiveContainer } from "recharts";

const initialData = [
  { month: "Jan", orders: 40 },
  { month: "Feb", orders: 55 },
  { month: "Mar", orders: 20 },
  { month: "Apr", orders: 45 },
  { month: "May", orders: 65 },
  { month: "Jun", orders: 35 },
  { month: "Jul", orders: 25 },
  { month: "Aug", orders: 50 },
  { month: "Sep", orders: 75 },
  { month: "Oct", orders: 45 },
  { month: "Nov", orders: 55 },
  { month: "Dec", orders: 15 },
];

interface RecentOrderChartProps {
  onDataReady?: (data: typeof initialData) => void;
  refreshTrigger?: number;
}

export function RecentOrderChart({ onDataReady, refreshTrigger }: RecentOrderChartProps) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (onDataReady) {
      onDataReady(data);
    }
  }, [data, onDataReady]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      // Simulate data refresh with slight variations
      setData(prevData => 
        prevData.map(item => ({
          ...item,
          orders: Math.max(0, item.orders + Math.floor(Math.random() * 10) - 5)
        }))
      );
    }
  }, [refreshTrigger]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#666", fontSize: 12 }}
          className="text-gray-600 dark:text-gray-400"
          axisLine={{ stroke: "#e0e0e0" }}
        />
        <YAxis
          tick={{ fill: "#666", fontSize: 12 }}
          className="text-gray-600 dark:text-gray-400"
          axisLine={{ stroke: "#e0e0e0" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
          }}
          className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
        <Area
          type="monotone"
          dataKey="orders"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#colorOrders)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

