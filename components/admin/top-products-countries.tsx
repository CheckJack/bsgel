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

export function TopProductsCountries() {
  const router = useRouter();
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCountries, setTopCountries] = useState<TopCountry[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [ordersRes, productsRes] = await Promise.all([
          fetch("/api/orders?limit=1000"),
          fetch("/api/products"),
        ]);

        if (ordersRes.ok && productsRes.ok) {
          const ordersData = await ordersRes.json();
          const productsData = await productsRes.json();
          const orders = ordersData.orders || [];
          const products = Array.isArray(productsData) ? productsData : (productsData.products || []);

          // Calculate top products by quantity sold and track country for each product
          const productSales: { [key: string]: { 
            name: string; 
            quantity: number; 
            revenue: number; 
            image?: string; 
            productId: string;
            countrySales: { [countryCode: string]: number }; // Track revenue per country
          } } = {};
          
          orders.forEach((order: any) => {
            // Extract country from shipping address for this order
            const countryCode = extractCountry(order.shippingAddress);
            
            order.items?.forEach((item: any) => {
              const productId = item.productId;
              const productName = item.product?.name || "Unknown Product";
              const productImage = item.product?.image || item.product?.images?.[0] || null;
              const itemRevenue = parseFloat(item.price.toString()) * item.quantity;
              
              if (!productSales[productId]) {
                productSales[productId] = { 
                  name: productName, 
                  quantity: 0, 
                  revenue: 0, 
                  image: productImage,
                  productId: productId,
                  countrySales: {}
                };
              }
              productSales[productId].quantity += item.quantity;
              productSales[productId].revenue += itemRevenue;
              
              // Track revenue by country for this product
              if (!productSales[productId].countrySales[countryCode]) {
                productSales[productId].countrySales[countryCode] = 0;
              }
              productSales[productId].countrySales[countryCode] += itemRevenue;
            });
          });

          // Get top 5 products with their top country
          const topProductsList = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5)
            .map((product, index) => {
              // Find the country with the highest revenue for this product
              const topCountryCode = Object.entries(product.countrySales)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || "GB"; // Default to GB if no country data
              const topCountryFlag = countryFlags[topCountryCode] || "🇬🇧";
              
              return {
                name: product.name.length > 30 ? product.name.substring(0, 30) + "..." : product.name,
                items: `${product.quantity} Items`,
                coupon: "N/A",
                discount: "-0",
                price: `€${product.revenue.toFixed(2)}`,
                flag: topCountryFlag,
                image: product.image,
                productId: product.productId,
              };
            });
          setTopProducts(topProductsList);

          // Calculate sales by country (using shipping address if available)
          const countrySales: { [key: string]: { name: string; sales: number; code: string } } = {};
          let total = 0;

          orders.forEach((order: any) => {
            const orderTotal = parseFloat(order.total.toString());
            total += orderTotal;
            
            // Extract country from shipping address
            const countryCode = extractCountry(order.shippingAddress);
            const countryName = countryCodeToName[countryCode] || countryCode;
            
            if (!countrySales[countryCode]) {
              countrySales[countryCode] = { name: countryName, sales: 0, code: countryCode };
            }
            countrySales[countryCode].sales += orderTotal;
          });

          setTotalSales(total);

          // Get top 6 countries
          const topCountriesList = Object.values(countrySales)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 6)
            .map((country, index, array) => ({
              name: country.name,
              flag: countryFlags[country.code] || "🇬🇧",
              trend: index === 0 || Math.random() > 0.5 ? "up" : "down" as "up" | "down",
              sales: `€${country.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            }));
          setTopCountries(topCountriesList);
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

