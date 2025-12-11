"use client";

import { useEffect, useState } from "react";
import { KPICard } from "@/components/admin/kpi-card";
import { ChartCard } from "@/components/admin/chart-card";
import { RecentOrderChart } from "@/components/admin/recent-order-chart";
import { NewComments } from "@/components/admin/new-comments";
import { OrdersEarnings } from "@/components/admin/orders-earnings";
import { TopProductsCountries } from "@/components/admin/top-products-countries";
import { CheckCircle2, DollarSign, FileText, Users } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/orders"),
      ]);

      if (productsRes.ok && ordersRes.ok) {
        const productsData = await productsRes.json();
        const ordersData = await ordersRes.json();
        
        // Handle different response formats
        const products = Array.isArray(productsData) ? productsData : (productsData.products || []);
        const orders = Array.isArray(ordersData) ? ordersData : (ordersData.orders || []);

        const totalRevenue = Array.isArray(orders) ? orders.reduce(
          (sum: number, order: any) => sum + parseFloat(order.total?.toString() || '0'),
          0
        ) : 0;
        const pendingOrders = Array.isArray(orders) ? orders.filter(
          (order: any) => order.status === "PENDING" || order.status === "PROCESSING"
        ).length : 0;

        setStats({
          totalProducts: Array.isArray(products) ? products.length : 0,
          totalOrders: Array.isArray(orders) ? orders.length : 0,
          totalRevenue,
          pendingOrders,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setRefreshTrigger(prev => prev + 1);
    await fetchStats();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  // Generate graph data from stats (placeholder for now - could be enhanced with historical data)
  const salesData = Array(12).fill(Math.floor(stats.totalOrders / 12) || 0);
  const incomeData = Array(12).fill(Math.floor(stats.totalRevenue / 12) || 0);
  const ordersData = Array(12).fill(Math.floor(stats.totalOrders / 12) || 0);
  const visitorData = Array(12).fill(Math.floor(stats.totalProducts / 12) || 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("dashboard.title")}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t("dashboard.welcome")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KPICard
          title={t("dashboard.totalSales")}
          value={stats.totalOrders.toLocaleString()}
          trend={1.56}
          icon={<CheckCircle2 className="h-7 w-7" />}
          iconColor="#10b981"
          graphColor="#10b981"
          graphData={salesData}
        />
        <KPICard
          title={t("dashboard.totalIncome")}
          value={`€${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={-1.56}
          icon={<DollarSign className="h-7 w-7" />}
          iconColor="#f97316"
          graphColor="#f97316"
          graphData={incomeData}
        />
        <KPICard
          title={t("dashboard.ordersPaid")}
          value={stats.totalOrders.toLocaleString()}
          trend={0}
          icon={<FileText className="h-7 w-7" />}
          iconColor="#94a3b8"
          graphColor="#94a3b8"
          graphData={ordersData}
        />
        <KPICard
          title={t("dashboard.totalProducts")}
          value={stats.totalProducts.toLocaleString()}
          trend={1.56}
          icon={<Users className="h-7 w-7" />}
          iconColor="#3b82f6"
          graphColor="#3b82f6"
          graphData={visitorData}
        />
      </div>

      {/* Recent Order Chart - Full Width */}
      <div className="mb-6">
        <ChartCard 
          title={t("dashboard.recentOrder")}
          onRefresh={handleRefresh}
          exportData={chartData}
          exportFileName="recent_orders"
        >
          <RecentOrderChart 
            onDataReady={setChartData}
            refreshTrigger={refreshTrigger}
          />
        </ChartCard>
      </div>

      {/* Orders & Earnings */}
      <div className="mb-6">
        <OrdersEarnings />
      </div>

      {/* Top Products & Countries */}
      <div className="mb-6">
        <TopProductsCountries />
      </div>

      {/* New Comments - Full Width */}
      <div>
        <NewComments />
      </div>
    </div>
  );
}
