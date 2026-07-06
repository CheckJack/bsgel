"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { GeminiHeroBadge } from "@/components/layout/category-hero-badge";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { ShopProductsHeader } from "@/components/shop/shop-products-header";
import { ShopProductsTitle } from "@/components/shop/shop-products-title";
import { ShopEmptyProducts } from "@/components/shop/shop-empty-products";
import { useLanguage } from "@/contexts/language-context";
import { useShopFilters } from "@/hooks/use-shop-filters";
import { Pagination } from "@/components/ui/pagination";

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

export default function GeminiPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const filters = useShopFilters();

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.sortBy, filters.minPrice, filters.maxPrice, filters.showFeatured]);

  useEffect(() => {
    fetchGeminiProducts();
  }, [currentPage, filters.sortBy, filters.minPrice, filters.maxPrice, filters.showFeatured]);

  const fetchGeminiProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        showcasingSection: "gemini",
        page: currentPage.toString(),
        limit: "10",
      });
      filters.appendToSearchParams(params);

      const res = await fetch(`/api/products?${params.toString()}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data.pagination) {
          setProducts(data.products || []);
          setTotalPages(data.pagination.totalPages || 1);
        } else {
          setProducts(Array.isArray(data) ? data : data.products || []);
          setTotalPages(1);
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
      <section className="relative h-[36vh] w-full overflow-hidden md:h-[44vh]">
        <GeminiHeroBadge />
        <Image src="/gemini-hero.svg" alt={t("nav.shopMenu.gemini")} fill className="object-cover md:hidden" priority unoptimized />
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label={t("nav.shopMenu.gemini")}
          className="absolute inset-0 hidden h-full w-full object-cover md:block"
        >
          <source src="/gemini-hero.mp4" type="video/mp4" />
        </video>
      </section>

      <section id="products" className="relative w-full min-h-screen bg-brand-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <ShopProductsHeader
            filters={filters}
            title={
              <>
                <ShopProductsTitle>{t("productPages.geminiProducts")}</ShopProductsTitle>
              </>
            }
          />
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("productPages.loadingProducts")}</p>
            </div>
          ) : products.length === 0 ? (
            <ShopEmptyProducts
              hasActiveFilters={filters.hasActiveFilters}
              onClearFilters={() => filters.clearFilters()}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 justify-items-start gap-x-5 gap-y-12 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-3 lg:gap-x-12">
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
              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Product Reviews Section */}
      <ProductReviews
        showcasingSection="gemini"
        productIds={products.map((product) => product.id)}
      />

    </>
  );
}

