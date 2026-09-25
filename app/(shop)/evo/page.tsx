"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import mobileEvoHero from "../../../egw98.png";
import { GeminiHeroBadge } from "@/components/layout/category-hero-badge";
import { DesktopHeroVideo } from "@/components/layout/desktop-hero-video";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { ShopProductsHeader } from "@/components/shop/shop-products-header";
import { ShopProductsTitle } from "@/components/shop/shop-products-title";
import { ShopEmptyProducts } from "@/components/shop/shop-empty-products";
import { useLanguage } from "@/contexts/language-context";
import { useShopFilters } from "@/hooks/use-shop-filters";
import { fetchShopCategories } from "@/lib/shop-categories";
import { BRAND_LINE_SLUGS, findCategoryByBrandSlug } from "@/lib/brand-lines";

interface Product {
  id: string;
  slug?: string;
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
  const filters = useShopFilters();

  useEffect(() => {
    fetchEvoProducts();
  }, [filters.sortBy, filters.minPrice, filters.maxPrice, filters.showFeatured]);

  const fetchEvoProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "12",
      });
      filters.appendToSearchParams(params);
      const categoriesData = { categories: await fetchShopCategories() };
      const evoCategory = findCategoryByBrandSlug(categoriesData.categories ?? [], BRAND_LINE_SLUGS.evo);

      if (evoCategory) {
        setCategoryId(evoCategory.id);
        params.set("categoryId", evoCategory.id);
      } else {
        // Never fall back to search=evo — it matches unrelated Portuguese text
        // ("revolucionária", etc.) and pulls ~150 products with huge payloads.
        // Prefer the showcasing section tag if the category rename isn't resolvable.
        params.set("showcasingSection", "evo");
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
        <GeminiHeroBadge />
        <Image src={mobileEvoHero} alt={t("nav.shopMenu.evo")} fill className="object-cover md:hidden" priority unoptimized />
        <DesktopHeroVideo
          src="/evo-hero.mp4"
          ariaLabel={t("nav.shopMenu.evo")}
          className="hidden md:block"
        />
      </section>

      {/* Evo Products Grid Section */}
      <section id="products" className="relative w-full min-h-screen bg-brand-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <ShopProductsHeader
            filters={filters}
            title={
              <>
                <ShopProductsTitle>{t("productPages.evoProducts")}</ShopProductsTitle>
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
                    slug={product.slug}
                  name={product.name}
                  price={product.price}
                  salePrice={(product as any).salePrice}
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

