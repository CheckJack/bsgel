"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import mobileSpaHero from "../../../egw97.png";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { ShopProductsHeader } from "@/components/shop/shop-products-header";
import { ShopProductsTitle } from "@/components/shop/shop-products-title";
import { ShopEmptyProducts } from "@/components/shop/shop-empty-products";
import { useLanguage } from "@/contexts/language-context";
import { useShopFilters } from "@/hooks/use-shop-filters";
import { fetchShopCategories } from "@/lib/shop-categories";

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

export default function SpaPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const filters = useShopFilters();

  useEffect(() => {
    fetchSpaProducts();
  }, [filters.sortBy, filters.minPrice, filters.maxPrice, filters.showFeatured]);

  const fetchSpaProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "12",
      });
      filters.appendToSearchParams(params);
      const categoriesData = { categories: await fetchShopCategories() };
      const spaCategory = categoriesData.categories?.find(
        (cat: { name: string }) => cat.name.toLowerCase() === "spa"
      );

      if (spaCategory) {
        setCategoryId(spaCategory.id);
        params.set("categoryId", spaCategory.id);
      } else {
        params.set("search", "spa");
      }

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.pagination) {
          setProducts(data.products || []);
        } else {
          setProducts(Array.isArray(data) ? data : data.products || []);
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
        <div className="pointer-events-none absolute right-4 top-4 z-10 sm:right-6 sm:top-6 md:right-8 md:top-8">
          <Image
            src="/spa-hero-badge.png"
            alt={t("productPages.spa.heroBadgeAlt")}
            width={739}
            height={739}
            className="h-auto w-20 sm:w-24 md:w-28 lg:w-36 xl:w-40"
            unoptimized
          />
        </div>
        <Image src={mobileSpaHero} alt="SPA" fill className="object-cover md:hidden" priority unoptimized />
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label="SPA"
          className="absolute inset-0 hidden h-full w-full object-cover md:block"
        >
          <source src="/spa-hero.mp4" type="video/mp4" />
        </video>
      </section>

      <section id="products" className="relative w-full min-h-screen bg-brand-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <ShopProductsHeader
            filters={filters}
            title={
              <>
                <ShopProductsTitle>SPA BIO Sculpture</ShopProductsTitle>
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
          )}
        </div>
      </section>

      {/* Product Reviews Section */}
      <ProductReviews categoryId={categoryId} />
    </>
  );
}

