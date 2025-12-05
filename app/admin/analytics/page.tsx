"use client";

import { KPICard } from "@/components/admin/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { FileText, DollarSign, Users, TrendingUp, TrendingDown, Download, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// Sample data for KPI cards
const totalAmountData = [30, 45, 35, 50, 40, 55, 45, 60, 50, 65, 55, 70];
const totalRevenueData = [35, 40, 30, 45, 35, 50, 30, 45, 40, 50, 35, 40];
const totalCustomerData = [40, 45, 50, 45, 55, 60, 55, 65, 60, 70, 65, 75];

// Seller statistic data
const sellerStatisticData = [
  { month: "Jan", revenue: 57, profit: 40 },
  { month: "Feb", revenue: 78, profit: 55 },
  { month: "Mar", revenue: 61, profit: 43 },
  { month: "Apr", revenue: 75, profit: 52 },
  { month: "May", revenue: 35, profit: 25 },
  { month: "Jun", revenue: 70, profit: 49 },
  { month: "Jul", revenue: 88, profit: 62 },
  { month: "Aug", revenue: 110, profit: 77 },
  { month: "Sep", revenue: 82, profit: 57 },
  { month: "Oct", revenue: 134, profit: 94 },
  { month: "Nov", revenue: 44, profit: 31 },
];

// Total sale data
const totalSaleData = [
  { month: "Jan", revenue: 57, profit: 40 },
  { month: "Feb", revenue: 78, profit: 55 },
  { month: "Mar", revenue: 61, profit: 43 },
  { month: "Apr", revenue: 75, profit: 52 },
  { month: "May", revenue: 35, profit: 25 },
  { month: "Jun", revenue: 70, profit: 49 },
  { month: "Jul", revenue: 88, profit: 62 },
  { month: "Aug", revenue: 110, profit: 77 },
  { month: "Sep", revenue: 82, profit: 57 },
  { month: "Oct", revenue: 134, profit: 94 },
];

// Sale/Purchase return data
const salePurchaseData = [
  { time: "12:00", sale: 45, purchase: 30, return: 25 },
  { time: "13:00", sale: 52, purchase: 35, return: 28 },
  { time: "14:00", sale: 68, purchase: 48, return: 35 },
  { time: "15:00", sale: 75, purchase: 55, return: 40 },
  { time: "16:00", sale: 62, purchase: 42, return: 32 },
  { time: "17:00", sale: 55, purchase: 38, return: 28 },
];

// Transfer history data
const transferHistoryData = [
  { id: "11081197", name: "Kathryn Murphy", date: "Mar 20, 2023", total: "€2,700" },
  { id: "38766940", name: "Floyd Miles", date: "Mar 20, 2023", total: "€2,700" },
  { id: "43397744", name: "Brooklyn Simmons", date: "Mar 20, 2023", total: "€2,700" },
  { id: "66277431", name: "Wade Warren", date: "Mar 20, 2023", total: "€2,700" },
  { id: "58276066", name: "Devon Lane", date: "Mar 20, 2023", total: "€2,700" },
  { id: "93242854", name: "Jenny Wilson", date: "Mar 20, 2023", total: "€2,700" },
  { id: "11081197", name: "Jane Cooper", date: "Mar 20, 2023", total: "€2,700" },
  { id: "55700223", name: "Albert Flores", date: "Mar 20, 2023", total: "€2,700" },
  { id: "34034474", name: "Robert Fox", date: "Mar 20, 2023", total: "€2,700" },
  { id: "34034474", name: "Theresa Webb", date: "Mar 20, 2023", total: "€2,700" },
];

export default function AnalyticsPage() {
  return (
    <div>
      {/* Header with Title and Breadcrumbs */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Report</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <Link href="/admin" className="hover:text-gray-900 dark:hover:text-gray-100">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Report</span>
        </div>
      </div>

      {/* Three KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPICard
          title="Total Amount"
          value="34,945"
          trend={1.56}
          icon={<FileText className="h-7 w-7" />}
          iconColor="#3b82f6"
          graphColor="#3b82f6"
          graphData={totalAmountData}
          chartType="bar"
        />
        <KPICard
          title="Total Revenue"
          value="€37,802"
          trend={-1.56}
          icon={<DollarSign className="h-7 w-7" />}
          iconColor="#f97316"
          graphColor="#f97316"
          graphData={totalRevenueData}
          chartType="bar"
        />
        <KPICard
          title="Total Customer"
          value="34,945"
          trend={0}
          icon={<Users className="h-7 w-7" />}
          iconColor="#10b981"
          graphColor="#10b981"
          graphData={totalCustomerData}
          chartType="bar"
        />
      </div>

      {/* Seller Statistic and Total Sale Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Seller Statistic */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Seller statistic</CardTitle>
              <div className="flex items-center gap-2">
                <select className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <option>Last 30 days</option>
                </select>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <Download className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">0.56%</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">€37,802</p>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Profit</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">0.56%</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">€28,305</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sellerStatisticData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="month"
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
                <Bar dataKey="revenue" stackId="a" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" stackId="a" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Total Sale */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total sale</CardTitle>
              <div className="flex items-center gap-2">
                <select className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <option>Last 30 days</option>
                </select>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <Download className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">0.56%</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">€37,802</p>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Profit</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">0.56%</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">€28,305</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={totalSaleData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="month"
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
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sale / Purchase return */}
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sale / Purchase return</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl font-bold text-gray-900">€84.86B</span>
              <div className="flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-red-600">1.02%</span>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={salePurchaseData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="time"
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
                <Legend />
                <Line type="monotone" dataKey="sale" stroke="#f97316" strokeWidth={2} />
                <Line type="monotone" dataKey="purchase" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="return" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={salePurchaseData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="time"
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
                <Bar dataKey="sale" fill="#d1d5db" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Transfer History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Transfer Id</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {transferHistoryData.map((transfer, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{transfer.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{transfer.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{transfer.date}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">{transfer.total}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button className="p-1 hover:bg-blue-50 rounded text-blue-600">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-green-50 rounded text-green-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-red-50 rounded text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Showing 10 to 16 in 30 records</p>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded border border-gray-300">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">1</button>
              <button className="px-3 py-1 text-sm border border-blue-600 bg-blue-600 text-white rounded">2</button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">3</button>
              <button className="p-2 hover:bg-gray-100 rounded border border-gray-300">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

