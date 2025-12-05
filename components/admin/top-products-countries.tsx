"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";

const topProducts = [
  { name: "Patimax Fragrance Long...", items: "100 Items", coupon: "Sflat", discount: "-15", price: "€27.", flag: "🇪🇸" },
  { name: "Nulo MedalSeries Adult Cat...", items: "100 Items", coupon: "Sflat", discount: "-15", price: "€27.", flag: "🇮🇳" },
  { name: "Pedigree Puppy Dry Dog...", items: "100 Items", coupon: "Sflat", discount: "-15", price: "€27.", flag: "🇬🇧" },
  { name: "Biscoito Premier Cookie...", items: "100 Items", coupon: "Sflat", discount: "-15", price: "€27.", flag: "🇧🇷" },
  { name: "Pedigree Adult Dry Dog...", items: "100 Items", coupon: "Sflat", discount: "-15", price: "€27.", flag: "🇫🇷" },
];

const topCountries = [
  { name: "Turkish Flag", flag: "🇹🇷", trend: "up", sales: "€6,972" },
  { name: "Belgium", flag: "🇧🇪", trend: "up", sales: "€6,972" },
  { name: "Sweden", flag: "🇸🇪", trend: "down", sales: "€6,972" },
  { name: "Vietnamese", flag: "🇻🇳", trend: "up", sales: "€6,972" },
  { name: "Australia", flag: "🇦🇺", trend: "down", sales: "€6,972" },
  { name: "Saudi Arabia", flag: "🇸🇦", trend: "down", sales: "€6,972" },
];

export function TopProductsCountries() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Products */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Products</CardTitle>
            <button 
              onClick={() => router.push("/admin/products")}
              className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              View all
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center gap-3 pb-4 border-b dark:border-gray-700 last:border-0 last:pb-0">
                <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{product.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{product.items}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Coupon Code:</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{product.coupon}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-lg">{product.flag}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-red-600 dark:text-red-400">{product.discount}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Countries */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Countries By Sales</CardTitle>
            <button 
              onClick={() => router.push("/admin/analytics")}
              className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              View all
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-3xl font-bold mb-1 text-gray-900 dark:text-gray-100">€37,802</div>
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span>1.56%</span>
              <span className="text-gray-500 dark:text-gray-400">since last weekend</span>
            </div>
          </div>
          <div className="space-y-3">
            {topCountries.map((country, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{country.flag}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{country.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {country.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{country.sales}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

