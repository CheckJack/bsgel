"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";

interface TopProduct {
  name: string;
  items: string;
  coupon: string;
  discount: string;
  price: string;
  flag: string;
  image?: string;
  productId: string;
}

interface TopCountry {
  name: string;
  flag: string;
  trend: "up" | "down";
  sales: string;
}

// Country name to country code mapping
const countryNameToCode: { [key: string]: string } = {
  "united kingdom": "GB", "uk": "GB", "great britain": "GB", "britain": "GB",
  "united states": "US", "usa": "US", "united states of america": "US",
  "canada": "CA",
  "australia": "AU",
  "germany": "DE", "deutschland": "DE",
  "france": "FR",
  "italy": "IT", "italia": "IT",
  "spain": "ES", "españa": "ES",
  "netherlands": "NL", "holland": "NL",
  "belgium": "BE", "belgië": "BE", "belgique": "BE",
  "sweden": "SE", "sverige": "SE",
  "norway": "NO", "norge": "NO",
  "denmark": "DK", "danmark": "DK",
  "finland": "FI", "suomi": "FI",
  "poland": "PL", "polska": "PL",
  "ireland": "IE", "éire": "IE",
  "portugal": "PT",
  "greece": "GR", "ελλάδα": "GR",
  "turkey": "TR", "türkiye": "TR",
  "saudi arabia": "SA",
  "united arab emirates": "AE", "uae": "AE",
  "india": "IN",
  "china": "CN",
  "japan": "JP",
  "south korea": "KR", "korea": "KR",
  "brazil": "BR", "brasil": "BR",
  "mexico": "MX", "méxico": "MX",
  "argentina": "AR",
  "south africa": "ZA",
  "vietnam": "VN", "việt nam": "VN",
};

// Country code to flag emoji mapping
const countryFlags: { [key: string]: string } = {
  "GB": "🇬🇧", "US": "🇺🇸", "CA": "🇨🇦", "AU": "🇦🇺", "DE": "🇩🇪",
  "FR": "🇫🇷", "IT": "🇮🇹", "ES": "🇪🇸", "NL": "🇳🇱", "BE": "🇧🇪",
  "SE": "🇸🇪", "NO": "🇳🇴", "DK": "🇩🇰", "FI": "🇫🇮", "PL": "🇵🇱",
  "IE": "🇮🇪", "PT": "🇵🇹", "GR": "🇬🇷", "TR": "🇹🇷", "SA": "🇸🇦",
  "AE": "🇦🇪", "IN": "🇮🇳", "CN": "🇨🇳", "JP": "🇯🇵", "KR": "🇰🇷",
  "BR": "🇧🇷", "MX": "🇲🇽", "AR": "🇦🇷", "ZA": "🇿🇦", "VN": "🇻🇳",
};

// Country code to country name mapping
const countryCodeToName: { [key: string]: string } = {
  "GB": "United Kingdom", "US": "United States", "CA": "Canada", "AU": "Australia", "DE": "Germany",
  "FR": "France", "IT": "Italy", "ES": "Spain", "NL": "Netherlands", "BE": "Belgium",
  "SE": "Sweden", "NO": "Norway", "DK": "Denmark", "FI": "Finland", "PL": "Poland",
  "IE": "Ireland", "PT": "Portugal", "GR": "Greece", "TR": "Turkey", "SA": "Saudi Arabia",
  "AE": "UAE", "IN": "India", "CN": "China", "JP": "Japan", "KR": "South Korea",
  "BR": "Brazil", "MX": "Mexico", "AR": "Argentina", "ZA": "South Africa", "VN": "Vietnam",
};

// Helper function to extract country from shipping address
const extractCountry = (shippingAddress: string | null): string => {
  if (!shippingAddress) return "GB"; // Default to GB
  
  // The address format is multiline with country on the last line
  // Format: firstName lastName\nemail\nphone\naddressLine1\naddressLine2?\npostalCode city\ndistrict\ncountry
  const lines = shippingAddress.split('\n').filter(line => line.trim());
  if (lines.length === 0) return "GB";
  
  // Country should be on the last line
  const countryLine = lines[lines.length - 1].trim();
  if (!countryLine) return "GB";
  
  // Try to match country name (case-insensitive)
  const countryLower = countryLine.toLowerCase();
  
  // Direct match
  if (countryNameToCode[countryLower]) {
    return countryNameToCode[countryLower];
  }
  
  // Partial match (in case country name has extra text)
  for (const [name, code] of Object.entries(countryNameToCode)) {
    if (countryLower.includes(name) || name.includes(countryLower)) {
      return code;
    }
  }
  
  // If no match found, return GB as default
  return "GB";
};

interface TopProductsCountriesProps {
  topProducts?: TopProduct[];
  topCountries?: TopCountry[];
  totalSales?: number;
}

export function TopProductsCountries({ topProducts: initialTopProducts, topCountries: initialTopCountries, totalSales: initialTotalSales }: TopProductsCountriesProps) {
  const router = useRouter();
  const [topProducts, setTopProducts] = useState<TopProduct[]>(initialTopProducts || []);
  const [topCountries, setTopCountries] = useState<TopCountry[]>(initialTopCountries || []);
  const [totalSales, setTotalSales] = useState(initialTotalSales || 0);
  const [isLoading, setIsLoading] = useState(!initialTopProducts);

  useEffect(() => {
    if (initialTopProducts) setTopProducts(initialTopProducts);
    if (initialTopCountries) setTopCountries(initialTopCountries);
    if (initialTotalSales !== undefined) setTotalSales(initialTotalSales);
    if (initialTopProducts && initialTopCountries) setIsLoading(false);
  }, [initialTopProducts, initialTopCountries, initialTotalSales]);

  useEffect(() => {
    const fetchData = async () => {
      if (initialTopProducts && initialTopCountries) return;
      try {
        setIsLoading(true);
        const res = await fetch("/api/admin/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setTopProducts(data.topProducts || []);
          setTopCountries(data.topCountries || []);
          setTotalSales(data.totalRevenue || 0);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No products found
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.productId || index} className="flex items-center gap-3 pb-4 border-b dark:border-gray-700 last:border-0 last:pb-0">
                  <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{product.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{product.items}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Revenue:</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{product.price}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-lg">{product.flag}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <div className="text-3xl font-bold mb-1 text-gray-900 dark:text-gray-100">
              €{totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span>1.56%</span>
              <span className="text-gray-500 dark:text-gray-400">since last weekend</span>
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : topCountries.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No country data available
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

