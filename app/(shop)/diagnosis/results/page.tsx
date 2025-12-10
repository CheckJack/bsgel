"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";

interface Diagnosis {
  condition: string;
  severity: "mild" | "moderate" | "severe";
  description: string;
  recommendations: string[];
  productCategories: string[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  images?: string[];
  featured: boolean;
  category: {
    id: string;
    name: string;
  } | null;
}

export default function DiagnosisResultsPage() {
  const router = useRouter();
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Retrieve diagnosis data from sessionStorage
    const storedDiagnosis = sessionStorage.getItem("diagnosis_result");
    
    if (storedDiagnosis) {
      try {
        const parsedDiagnosis = JSON.parse(storedDiagnosis);
        setDiagnosis(parsedDiagnosis);
        fetchRecommendedProducts(parsedDiagnosis.productCategories);
      } catch (error) {
        console.error("Failed to parse diagnosis data:", error);
        // Redirect back to diagnosis if data is invalid
        router.push("/diagnosis");
      }
    } else {
      // No diagnosis data found, redirect back
      router.push("/diagnosis");
    }
    setIsLoading(false);
  }, [router]);

  const fetchRecommendedProducts = async (categories: string[]) => {
    setIsLoadingProducts(true);
    try {
      // Fetch all products and filter by category names or keywords
      const res = await fetch("/api/products");
      if (res.ok) {
        const allProducts: Product[] = await res.json();
        
        // Filter products based on category names or product name/description keywords
        const keywords = [
          ...categories,
          "strength",
          "strengthening",
          "cuticle",
          "oil",
          "moisturiz",
          "hydrat",
          "treatment",
          "growth",
          "base",
          "care",
        ];

        const filtered = allProducts.filter((product) => {
          const nameLower = product.name.toLowerCase();
          const descLower = (product.description || "").toLowerCase();
          const categoryName = (product.category?.name || "").toLowerCase();

          return keywords.some((keyword) =>
            nameLower.includes(keyword) ||
            descLower.includes(keyword) ||
            categoryName.includes(keyword)
          );
        });

        // If no specific matches, show featured products or all products
        const recommended = filtered.length > 0 
          ? filtered.slice(0, 6)
          : allProducts.filter(p => p.featured).slice(0, 6);

        setRecommendedProducts(recommended);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const restartDiagnosis = () => {
    sessionStorage.removeItem("diagnosis_result");
    router.push("/diagnosis");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading your diagnosis...</div>
        </div>
      </div>
    );
  }

  if (!diagnosis) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Full Page Layout - Centered Content */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Your Nail Diagnosis</h1>
          <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
            Based on your responses, here's what we found:
          </p>
        </div>

        {/* Diagnosis Card */}
        <Card className="mb-12 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="text-2xl lg:text-3xl">{diagnosis.condition}</CardTitle>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  diagnosis.severity === "severe"
                    ? "bg-red-100 text-red-800"
                    : diagnosis.severity === "moderate"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {diagnosis.severity.charAt(0).toUpperCase() + diagnosis.severity.slice(1)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 text-lg mb-8 leading-relaxed">{diagnosis.description}</p>

            <div className="mb-6">
              <h3 className="font-semibold text-xl mb-4">Recommendations:</h3>
              <ul className="space-y-3 text-gray-700">
                {diagnosis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold mt-0.5">
                      {index + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Products Section */}
        <div className="mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-center">Recommended Products</h2>
          {isLoadingProducts ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600">Loading recommended products...</div>
            </div>
          ) : recommendedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4 text-lg">
                No specific products found. Check out our full product range!
              </p>
              <Button onClick={() => router.push("/products")} size="lg">
                View All Products
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {recommendedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.image}
                  images={product.images}
                  featured={product.featured}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <Button onClick={restartDiagnosis} variant="outline" size="lg" className="w-full sm:w-auto">
            Take Diagnosis Again
          </Button>
          <Button onClick={() => router.push("/products")} size="lg" className="w-full sm:w-auto">
            View All Products
          </Button>
        </div>
      </div>
    </div>
  );
}
