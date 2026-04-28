"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { Filter } from "lucide-react";
import { Select } from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  images?: string[];
  featured: boolean;
  rating?: number;
  reviewCount?: number;
  category: {
    id: string;
    name: string;
  } | null;
}

export default function EvoPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchEvoProducts();
  }, [sortBy]);



  const fetchEvoProducts = async () => {
    setIsLoading(true);
    try {
      // First, try to find an "Evo" category
      const categoriesRes = await fetch("/api/categories");
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        const evoCategory = categoriesData.categories?.find(
          (cat: { name: string }) => cat.name.toLowerCase() === "evo"
        );

        if (evoCategory) {
          setCategoryId(evoCategory.id);
          // If category exists, fetch all products in that category
          const res = await fetch(`/api/products?categoryId=${evoCategory.id}&sortBy=${encodeURIComponent(sortBy)}`);
          if (res.ok) {
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : data.products || []);
          }
        } else {
          // Otherwise, search for products with "evo" in the name
          const res = await fetch(`/api/products?search=evo&sortBy=${encodeURIComponent(sortBy)}`);
          if (res.ok) {
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : data.products || []);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <>
      <section className="relative w-full h-[36vh] md:h-[44vh] overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/evo-hero-custom.png"
            alt="Evo"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
        <div className="relative z-10 flex h-full items-center">
          <div className="container mx-auto flex h-full max-w-7xl items-center px-4">
            <h1 className="text-4xl font-medium text-white sm:text-5xl md:text-6xl">Evo</h1>
          </div>
        </div>
      </section>

      {/* Evo Products Grid Section */}
      <section id="products" className="relative w-full min-h-screen bg-brand-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-brand-black mb-3">
                {t("productPages.evoProducts")}
              </h2>
              <div className="h-1 w-16 bg-brand-champagne"></div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters((prev) => !prev)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {t("shop.sortBy")}
            </Button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 mb-8">
              <div className="max-w-xs">
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">{t("shop.newestFirst")}</option>
                  <option value="oldest">{t("shop.oldestFirst")}</option>
                  <option value="price-asc">{t("shop.priceLowToHigh")}</option>
                  <option value="price-desc">{t("shop.priceHighToLow")}</option>
                  <option value="name-asc">{t("shop.nameAtoZ")}</option>
                  <option value="name-desc">{t("shop.nameZtoA")}</option>
                </Select>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("productPages.loadingProducts")}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("productPages.noEvoProducts")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.image}
                  images={product.images}
                  featured={product.featured}
                  outOfStock={(product as any).outOfStock}
                  hemaFree={(product as any).hemaFree}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Reviews Section */}
      <ProductReviews
        categoryId={categoryId}
        productIds={products.map((product) => product.id)}
      />

    </>
  );
}

