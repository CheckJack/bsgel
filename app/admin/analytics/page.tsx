"use client";

import { useEffect, useState } from "react";
import { KPICard } from "@/components/admin/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Download,
  Package,
  Calendar,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { toast, handleApiError } from "@/lib/utils";

interface AnalyticsData {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    pendingOrders: number;
    revenueTrend: number;
    ordersTrend: number;
    customersTrend: number;
  };
  revenueTimeSeries: { date: string; revenue: number }[];
  ordersTimeSeries: { date: string; orders: number }[];
  customersTimeSeries: { date: string; customers: number }[];
  orderStatusBreakdown: Record<string, number>;
  revenueByStatus: Record<string, number>;
  revenueByCategory: { name: string; revenue: number }[];
  topProducts: { name: string; revenue: number; quantity: number; category: string | null }[];
  customerMetrics: {
    repeatCustomers: number;
    repeatCustomerRate: number;
    newCustomers: number;
  };
  couponMetrics: {
    totalCoupons: number;
    activeCoupons: number;
    totalCouponUsage: number;
    totalDiscountGiven: number;
  };
  dateRange: {
    start: string;
    end: string;
  };
}

const COLORS = ["#3b82f6", "#f97316", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics?period=${period}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { response, error: errorData.error };
      }
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      handleApiError(err, "load analytics data");
      console.error("Failed to fetch analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const exportToCSV = () => {
    if (!data) {
      toast("No data available to export", "warning");
      return;
    }

    try {
      const csvRows = [];
      csvRows.push("Metric,Value");
      csvRows.push(`Total Revenue,${data.kpis.totalRevenue}`);
      csvRows.push(`Total Orders,${data.kpis.totalOrders}`);
      csvRows.push(`Total Customers,${data.kpis.totalCustomers}`);
      csvRows.push(`Average Order Value,${data.kpis.averageOrderValue}`);
      csvRows.push(`Pending Orders,${data.kpis.pendingOrders}`);
      csvRows.push("");
      csvRows.push("Date,Revenue");
      data.revenueTimeSeries.forEach((item) => {
        csvRows.push(`${item.date},${item.revenue}`);
      });

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast("Analytics data exported successfully", "success");
    } catch (error) {
      handleApiError(error, "export analytics data");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Unable to load analytics data</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const revenueChartData = data.revenueTimeSeries.map((item) => ({
    date: formatDate(item.date),
    revenue: item.revenue,
  }));

  const ordersChartData = data.ordersTimeSeries.map((item) => ({
    date: formatDate(item.date),
    orders: item.orders,
  }));

  const orderStatusData = Object.entries(data.orderStatusBreakdown).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const revenueByCategoryData = data.revenueByCategory.slice(0, 6);

  // Calculate KPI graph data (last 12 data points for mini charts)
  const revenueGraphData = data.revenueTimeSeries
    .slice(-12)
    .map((item) => item.revenue);
  const ordersGraphData = data.ordersTimeSeries
    .slice(-12)
    .map((item) => item.orders);
  const customersGraphData = data.customersTimeSeries
    .slice(-12)
    .map((item) => item.customers);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {new Date(data.dateRange.start).toLocaleDateString()} -{" "}
            {new Date(data.dateRange.end).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={fetchAnalytics}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        <Link href="/admin" className="hover:text-gray-900 dark:hover:text-gray-100">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">Analytics</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(data.kpis.totalRevenue)}
          trend={data.kpis.revenueTrend}
          icon={<DollarSign className="h-7 w-7" />}
          iconColor="#f97316"
          graphColor="#f97316"
          graphData={revenueGraphData}
          chartType="line"
        />
        <KPICard
          title="Total Orders"
          value={data.kpis.totalOrders.toLocaleString()}
          trend={data.kpis.ordersTrend}
          icon={<ShoppingCart className="h-7 w-7" />}
          iconColor="#3b82f6"
          graphColor="#3b82f6"
          graphData={ordersGraphData}
          chartType="line"
        />
        <KPICard
          title="Total Customers"
          value={data.kpis.totalCustomers.toLocaleString()}
          trend={data.kpis.customersTrend}
          icon={<Users className="h-7 w-7" />}
          iconColor="#10b981"
          graphColor="#10b981"
          graphData={customersGraphData}
          chartType="line"
        />
        <KPICard
          title="Avg Order Value"
          value={formatCurrency(data.kpis.averageOrderValue)}
          trend={0}
          icon={<Package className="h-7 w-7" />}
          iconColor="#8b5cf6"
          graphColor="#8b5cf6"
          graphData={revenueGraphData.map((r, i) => 
            ordersGraphData[i] ? r / ordersGraphData[i] : 0
          )}
          chartType="line"
        />
      </div>

      {/* Revenue and Orders Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Over Time */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Revenue Over Time
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#666", fontSize: 12 }}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <YAxis
                  tick={{ fill: "#666", fontSize: 12 }}
                  axisLine={{ stroke: "#e0e0e0" }}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Over Time */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Orders Over Time
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#666", fontSize: 12 }}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <YAxis
                  tick={{ fill: "#666", fontSize: 12 }}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Order Status and Revenue by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Order Status Breakdown */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Order Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {Object.entries(data.orderStatusBreakdown).map(([status, count], index) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{status}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {count} ({formatCurrency(data.revenueByStatus[status] || 0)})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Category */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Revenue by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByCategoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  type="number"
                  tick={{ fill: "#666", fontSize: 12 }}
                  axisLine={{ stroke: "#e0e0e0" }}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "#666", fontSize: 12 }}
                  axisLine={{ stroke: "#e0e0e0" }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Top Products by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Category
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Quantity Sold
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {product.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {product.category || "Uncategorized"}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">
                      {product.quantity}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(product.revenue)}
                    </td>
                  </tr>
                ))}
                {data.topProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No products sold in this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Customer and Coupon Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customer Metrics */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Customer Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">New Customers</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.customerMetrics.newCustomers}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Repeat Customers</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.customerMetrics.repeatCustomers}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Repeat Rate</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.customerMetrics.repeatCustomerRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coupon Metrics */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Coupon Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Coupons</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.couponMetrics.totalCoupons}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Coupons</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.couponMetrics.activeCoupons}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Usage</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.couponMetrics.totalCouponUsage}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Discount Given</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(data.couponMetrics.totalDiscountGiven)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
