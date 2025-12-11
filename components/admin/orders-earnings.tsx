"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreVertical, TrendingUp, Download, RefreshCw, Settings } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SettingsModal } from "./settings-modal";

interface OrderData {
  product: string;
  price: string;
  date: string;
  image?: string;
}

interface EarningsData {
  month: string;
  revenue: number;
  profit: number;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function OrdersEarnings() {
  const [ordersMenuOpen, setOrdersMenuOpen] = useState(false);
  const [earningsMenuOpen, setEarningsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOrdersSettingsOpen, setIsOrdersSettingsOpen] = useState(false);
  const [isEarningsSettingsOpen, setIsEarningsSettingsOpen] = useState(false);
  const [ordersData, setOrdersData] = useState<OrderData[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const ordersMenuRef = useRef<HTMLDivElement>(null);
  const earningsMenuRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders?limit=1000");
      if (res.ok) {
        const response = await res.json();
        const orders = response.orders || [];
        
        // Get recent orders (last 5)
        const recentOrders = orders
          .slice(0, 5)
          .map((order: any) => {
            const firstItem = order.items?.[0];
            const productName = firstItem?.product?.name || "Unknown Product";
            const productImage = firstItem?.product?.image || firstItem?.product?.images?.[0] || null;
            const orderDate = new Date(order.createdAt);
            return {
              product: productName.length > 30 ? productName.substring(0, 30) + "..." : productName,
              price: `€${parseFloat(order.total.toString()).toFixed(2)}`,
              date: orderDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
              image: productImage,
            };
          });
        setOrdersData(recentOrders);
        
        // Calculate earnings by month
        const earningsByMonth: { [key: string]: { revenue: number; profit: number } } = {};
        
        // Initialize last 8 months
        const now = new Date();
        for (let i = 7; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          earningsByMonth[monthKey] = { revenue: 0, profit: 0 };
        }
        
        // Calculate revenue and profit by month
        orders.forEach((order: any) => {
          const orderDate = new Date(order.createdAt);
          const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          if (earningsByMonth.hasOwnProperty(monthKey)) {
            const revenue = parseFloat(order.total.toString());
            earningsByMonth[monthKey].revenue += revenue;
            // Estimate profit as 75% of revenue (you can adjust this)
            earningsByMonth[monthKey].profit += revenue * 0.75;
          }
        });
        
        // Convert to chart data
        const chartData: EarningsData[] = Object.keys(earningsByMonth)
          .sort()
          .map((key) => {
            const date = new Date(key + '-01');
            return {
              month: monthNames[date.getMonth()],
              revenue: Math.round(earningsByMonth[key].revenue),
              profit: Math.round(earningsByMonth[key].profit),
            };
          });
        setEarningsData(chartData);
        
        // Calculate totals
        const totalRev = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total.toString()), 0);
        setTotalRevenue(totalRev);
        setTotalProfit(totalRev * 0.75); // Estimate profit
      }
    } catch (error) {
      console.error("Failed to fetch orders data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ordersMenuRef.current && !ordersMenuRef.current.contains(event.target as Node)) {
        setOrdersMenuOpen(false);
      }
      if (earningsMenuRef.current && !earningsMenuRef.current.contains(event.target as Node)) {
        setEarningsMenuOpen(false);
      }
    };

    if (ordersMenuOpen || earningsMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ordersMenuOpen, earningsMenuOpen]);

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("No data available to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("No data available to export");
      return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (type: string) => {
    let dataToExport: any[] = [];
    let filename = "";

    if (type === "orders") {
      dataToExport = ordersData;
      filename = "orders";
    } else if (type === "earnings") {
      dataToExport = earningsData;
      filename = "earnings";
    }

    if (dataToExport.length > 0) {
      const format = window.confirm("Export as CSV? (OK for CSV, Cancel for JSON)");
      if (format) {
        exportToCSV(dataToExport, filename);
      } else {
        exportToJSON(dataToExport, filename);
      }
    } else {
      alert("No data available to export");
    }

    setOrdersMenuOpen(false);
    setEarningsMenuOpen(false);
  };

  const handleRefresh = async (type: string) => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    setOrdersMenuOpen(false);
    setEarningsMenuOpen(false);
  };

  const handleSettings = (type: string) => {
    if (type === "orders") {
      setIsOrdersSettingsOpen(true);
    } else {
      setIsEarningsSettingsOpen(true);
    }
    setOrdersMenuOpen(false);
    setEarningsMenuOpen(false);
  };

  const handleSettingsSave = (type: string, settings: any) => {
    console.log(`Settings saved for ${type}:`, settings);
    // Apply settings here
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Orders */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Orders</CardTitle>
            <div className="relative" ref={ordersMenuRef}>
              <button 
                onClick={() => setOrdersMenuOpen(!ordersMenuOpen)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              {ordersMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => handleExport("orders")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <button
                    onClick={() => handleRefresh("orders")}
                    disabled={isRefreshing}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </button>
                  <button
                    onClick={() => handleSettings("orders")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Product</th>
                  <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Price</th>
                  <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Delivery date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      Loading orders...
                    </td>
                  </tr>
                ) : ordersData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  ordersData.map((order, index) => (
                    <tr key={index} className="border-b dark:border-gray-700 last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                            {order.image ? (
                              <img 
                                src={order.image} 
                                alt={order.product}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to placeholder if image fails to load
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">No Img</div>
                            )}
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">{order.product}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">{order.price}</td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">{order.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Earnings */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Earnings</CardTitle>
            <div className="relative" ref={earningsMenuRef}>
              <button 
                onClick={() => setEarningsMenuOpen(!earningsMenuOpen)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              {earningsMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => handleExport("earnings")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <button
                    onClick={() => handleRefresh("earnings")}
                    disabled={isRefreshing}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </button>
                  <button
                    onClick={() => handleSettings("earnings")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  €{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>0.56%</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Profit</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  €{totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>0.56%</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
              ) : (
                <BarChart data={earningsData}>
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
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Settings Modals */}
      <SettingsModal
        isOpen={isOrdersSettingsOpen}
        onClose={() => setIsOrdersSettingsOpen(false)}
        title="Orders"
        type="table"
        onSave={(settings) => handleSettingsSave("orders", settings)}
      />
      <SettingsModal
        isOpen={isEarningsSettingsOpen}
        onClose={() => setIsEarningsSettingsOpen(false)}
        title="Earnings"
        type="chart"
        onSave={(settings) => handleSettingsSave("earnings", settings)}
      />
    </div>
  );
}

