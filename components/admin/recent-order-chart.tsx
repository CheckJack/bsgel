"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart, ResponsiveContainer } from "recharts";

interface ChartData {
  month: string;
  orders: number;
}

interface RecentOrderChartProps {
  onDataReady?: (data: ChartData[]) => void;
  refreshTrigger?: number;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function RecentOrderChart({ onDataReady, refreshTrigger }: RecentOrderChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrderData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders?limit=1000");
      if (res.ok) {
        const response = await res.json();
        const orders = response.orders || [];
        
        // Group orders by month
        const ordersByMonth: { [key: string]: number } = {};
        
        // Initialize all months with 0
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          ordersByMonth[monthKey] = 0;
        }
        
        // Count orders by month
        orders.forEach((order: any) => {
          const orderDate = new Date(order.createdAt);
          const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          if (ordersByMonth.hasOwnProperty(monthKey)) {
            ordersByMonth[monthKey]++;
          }
        });
        
        // Convert to chart data format
        const chartData: ChartData[] = Object.keys(ordersByMonth)
          .sort()
          .slice(-12) // Last 12 months
          .map((key) => {
            const date = new Date(key + '-01');
            return {
              month: monthNames[date.getMonth()],
              orders: ordersByMonth[key],
            };
          });
        
        setData(chartData);
        if (onDataReady) {
          onDataReady(chartData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch order data:", error);
      // Fallback to empty data
      const emptyData = monthNames.slice(-12).map(month => ({ month, orders: 0 }));
      setData(emptyData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchOrderData();
    }
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

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

