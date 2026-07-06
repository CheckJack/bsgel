"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import mobileColoursHero from "../../../egwkukukg.png";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { ShopFiltersDrawer, ShopFiltersToolbar } from "@/components/shop/shop-filters";
import { ShopProductsTitle } from "@/components/shop/shop-products-title";
import { ShopEmptyProducts } from "@/components/shop/shop-empty-products";
import { ColourToneSwatches } from "@/components/shop/colour-tone-swatches";
import { useShopFilters } from "@/hooks/use-shop-filters";
import {
  COLOUR_TONE_SECTIONS,
  getColourToneById,
} from "@/lib/colour-tones";
import { fetchShopCategories, type ShopCategory } from "@/lib/shop-categories";

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
  showcasingSections?: string[];
  category: {
    id: string;
    name: string;
  } | null;
}

interface Category extends ShopCategory {}

function ProductGrid({ products }: { products: Product[] }) {
  return (
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
          outOfStock={(product as { outOfStock?: boolean }).outOfStock}
          hemaFree={(product as { hemaFree?: boolean }).hemaFree}
          rating={product.rating}
          reviewCount={product.reviewCount}
        />
      ))}
    </div>
  );
}

export default function ColoursPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const filters = useShopFilters();
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedTone, setSelectedTone] = useState<string>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [brandCategoryId, setBrandCategoryId] = useState<string | undefined>();
  const productsSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchShopCategories()
      .then(setCategories)
      .catch((fetchError) => {
        console.error("Failed to fetch categories:", fetchError);
      });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, selectedTone, filters.sortBy, filters.minPrice, filters.maxPrice, filters.showFeatured]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        sortBy: filters.sortBy,
      });

      if (selectedBrand !== "all") {
        const brandCategory = categories.find((cat) => {
          const catNameLower = cat.name.toLowerCase().trim();
          const selectedLower = selectedBrand.toLowerCase().trim();

          if (selectedLower === "bio gel") {
            return (
              catNameLower === "bio gel" ||
              catNameLower === "biogel" ||
              catNameLower === "bio-gel" ||
              (catNameLower.includes("bio") && catNameLower.includes("gel"))
            );
          }

          return catNameLower === selectedLower;
        });

        if (brandCategory) {
          params.set("categoryId", brandCategory.id);
          setBrandCategoryId(brandCategory.id);
        } else {
          params.set("search", selectedBrand);
          setBrandCategoryId(undefined);
        }
      } else {
        setBrandCategoryId(undefined);
      }

      if (selectedTone !== "all") {
        const tone = getColourToneById(selectedTone);
        if (tone) {
          params.set("showcasingSection", tone.showcasingSection);
        }
      } else {
        params.set("showcasingSections", COLOUR_TONE_SECTIONS.join(","));
      }

      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.showFeatured) params.set("featured", "true");

      const res = await fetch(`/api/products?${params.toString()}`);

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await res.json();
      if (data.pagination) {
        setProducts(data.products || []);
        setTotalPages(data.pagination.totalPages || 1);
      } else {
        setProducts(Array.isArray(data) ? data : data.products || []);
        setTotalPages(1);
      }
    } catch (fetchError) {
      console.error("Failed to fetch products:", fetchError);
      setError("Failed to load products. Please try again later.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    filters.sortBy,
    filters.minPrice,
    filters.maxPrice,
    filters.showFeatured,
    selectedBrand,
    selectedTone,
    categories,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (window.location.hash !== "#products") return;

    const scrollToProducts = () => {
      productsSectionRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    };

    scrollToProducts();
    const timer = window.setTimeout(scrollToProducts, 100);
    return () => window.clearTimeout(timer);
  }, []);

  const clearAllFilters = () => {
    filters.clearFilters();
    setSelectedBrand("all");
    setSelectedTone("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filters.hasActiveFilters || selectedBrand !== "all" || selectedTone !== "all";

  const selectedToneLabel =
    selectedTone === "all"
      ? t("productPages.colours.allTones")
      : t(getColourToneById(selectedTone)?.labelKey ?? "productPages.colours.allTones");

  return (
    <>
      <section className="relative w-full h-[36vh] md:h-[44vh] overflow-hidden">
        <div className="pointer-events-none absolute right-4 top-4 z-10 sm:right-6 sm:top-6 md:right-8 md:top-8">
          <Image
            src="/colours-hero-badge.png"
            alt={t("productPages.colours.heroBadgeAlt")}
            width={2083}
            height={2083}
            className="h-auto w-20 sm:w-24 md:w-28 lg:w-36 xl:w-40"
            unoptimized
          />
        </div>
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={mobileColoursHero}
            alt={t("productPages.colours.heroDescription")}
            fill
            className="object-cover object-center md:hidden"
            priority
            unoptimized
          />
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-label={t("productPages.colours.heroDescription")}
            className="hidden h-full w-full object-cover object-center md:block"
          >
            <source src="/colours-hero.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <section
        id="products"
        ref={productsSectionRef}
        className="relative w-full min-h-screen bg-gradient-to-b from-gray-50/30 via-white to-white pt-24 pb-16 scroll-mt-24"
      >
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <ShopProductsTitle>{t("productPages.coloursProducts")}</ShopProductsTitle>
            </div>
            <ShopFiltersToolbar
              filters={filters}
              className="shrink-0"
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <ShopFiltersDrawer
            filters={filters}
            onClearAll={clearAllFilters}
            activeFilterTags={
              <>
                {selectedTone !== "all" && (
                  <span className="rounded bg-brand-champagne/20 px-2 py-1 text-xs font-light text-brand-black">
                    {selectedToneLabel}
                  </span>
                )}
                {selectedBrand !== "all" && (
                  <span className="rounded bg-brand-champagne/20 px-2 py-1 text-xs font-light text-brand-black">
                    {selectedBrand}
                  </span>
                )}
              </>
            }
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-black">{t("shop.colourTone")}</label>
              <ColourToneSwatches
                selectedTone={selectedTone}
                onToneChange={(toneId) => {
                  setSelectedTone(toneId);
                  setCurrentPage(1);
                }}
              />
              <p className="text-xs font-light text-brand-black/55">{selectedToneLabel}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-black">{t("shop.brand")}</label>
              <Select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">{t("shop.all")}</option>
                <option value="evo">{t("nav.shopMenu.evo")}</option>
                <option value="gemini">{t("nav.shopMenu.gemini")}</option>
                <option value="bio gel">{t("nav.shopMenu.bioGel")}</option>
              </Select>
            </div>
          </ShopFiltersDrawer>

          {error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => fetchProducts()} variant="outline">
                {t("common.tryAgain")}
              </Button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-champagne"></div>
              <p className="text-gray-600 mt-4">{t("products.loadingProducts")}</p>
            </div>
          ) : products.length === 0 ? (
            <ShopEmptyProducts
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearAllFilters}
              browseHref="/products"
            />
          ) : (
            <>
              <ProductGrid products={products} />
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

      <ProductReviews
        categoryId={brandCategoryId}
        productIds={products.map((product) => product.id)}
      />
    </>
  );
}
