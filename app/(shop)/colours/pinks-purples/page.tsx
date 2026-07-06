"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { ShopFiltersDrawer, ShopFiltersToolbar } from "@/components/shop/shop-filters";
import { ShopProductsTitle } from "@/components/shop/shop-products-title";
import { ShopEmptyProducts } from "@/components/shop/shop-empty-products";
import { useShopFilters } from "@/hooks/use-shop-filters";
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

export default function PinksPurplesPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const filters = useShopFilters();
  const productsSectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldShowId, setShouldShowId] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        showcasingSection: "pinks",
        page: currentPage.toString(),
        limit: "12",
        sortBy: filters.sortBy,
      });

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
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setError("Failed to load products. Please try again later.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters.sortBy, filters.minPrice, filters.maxPrice]);

  useEffect(() => {
    fetchProducts();
    const timer = setTimeout(() => {
      setShouldShowId(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Video autoplay failed:", error);
      });
    }
  }, []);

  

  const hasActiveFilters = filters.hasActiveFilters;

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (window.location.hash === '#products') {
                window.history.replaceState(null, '', window.location.pathname);
                window.scrollTo(0, 0);
              }
            })();
          `,
        }}
      />
      
      <section className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
                <div className="absolute inset-0 w-full h-full">
          <Image
            src="/fdhfdhfd.png"
            alt={t("productPagesExtended.coloursPinksPurples.hero.alt")}
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
        </div>
        
        <div className="relative z-10 w-full h-full flex items-center">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="max-w-2xl">
              <div className="text-white space-y-1 drop-shadow-lg">
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  {t("productPagesExtended.coloursPinksPurples.hero.line1")}
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  {t("productPagesExtended.coloursPinksPurples.hero.line2")}
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  {t("productPagesExtended.coloursPinksPurples.hero.line3")}
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  {t("productPagesExtended.coloursPinksPurples.hero.line4")}
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  {t("productPagesExtended.coloursPinksPurples.hero.line5")}
                </p>
              </div>
              
              <Link 
                href="#products" 
                className="inline-block mt-8"
                onClick={(e) => {
                  e.preventDefault();
                  productsSectionRef.current?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
              >
                <button className="px-5 py-2 md:px-6 md:py-2.5 border-2 border-white text-white font-normal text-sm md:text-base hover:bg-white/10 transition-colors backdrop-blur-sm">
                  {t("hero.shopNow")}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <section {...(shouldShowId && { id: "products" })} ref={productsSectionRef} className="relative w-full min-h-screen bg-gradient-to-b from-gray-50/30 via-white to-white pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div>
              <ShopProductsTitle>{t("nav.shopMenu.pinksPurples")}</ShopProductsTitle>
            </div>
            <ShopFiltersToolbar filters={filters} className="shrink-0" />
          </div>

          <ShopFiltersDrawer filters={filters} />

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

      <ProductReviews showcasingSection="pinks" />

      <section className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/Untitleddesign(4).mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-medium mb-4">
              {t("productPagesExtended.coloursPinksPurples.videoSection.title")}
            </h3>
            <p className="text-lg md:text-xl mb-6 max-w-2xl font-light">
              {t("productPagesExtended.coloursPinksPurples.videoSection.description")}
            </p>
            <Link 
              href="#products" 
              onClick={(e) => {
                e.preventDefault();
                productsSectionRef.current?.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
              }}
            >
              <button className="px-5 py-2 md:px-6 md:py-2.5 border-2 border-white text-white font-normal text-sm md:text-base hover:bg-white/10 transition-colors backdrop-blur-sm">
                {t("productPagesExtended.coloursPinksPurples.videoSection.cta")}
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

