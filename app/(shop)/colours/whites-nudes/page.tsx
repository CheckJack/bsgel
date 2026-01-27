"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { Filter, X } from "lucide-react";

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

export default function WhitesNudesPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const productsSectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldShowId, setShouldShowId] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        showcasingSection: "nudes",
        page: currentPage.toString(),
        limit: "12",
        sortBy: sortBy,
      });

      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);

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
  }, [currentPage, sortBy, minPrice, maxPrice]);

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

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const hasActiveFilters = minPrice || maxPrice || sortBy !== "newest";

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
        <div className="absolute inset-0 bg-black/20 z-[1]"></div>
        
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/cvncvky.png"
            alt={t("productPagesExtended.coloursWhitesNudes.hero.alt")}
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        </div>
        
        <div className="relative z-10 w-full h-full flex items-center">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="max-w-2xl">
              <div className="text-white space-y-1 drop-shadow-lg">
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  {t("productPagesExtended.coloursWhitesNudes.hero.line1")}
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  {t("productPagesExtended.coloursWhitesNudes.hero.line2")}
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  {t("productPagesExtended.coloursWhitesNudes.hero.line3")}
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  {t("productPagesExtended.coloursWhitesNudes.hero.line4")}
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  {t("productPagesExtended.coloursWhitesNudes.hero.line5")}
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
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-brand-black mb-3">
                {t("nav.shopMenu.whitesNudes")}
              </h2>
              <div className="h-1 w-16 bg-brand-champagne"></div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {t("shop.sortBy")}
              {hasActiveFilters && (
                <span className="ml-1 w-2 h-2 rounded-full bg-brand-champagne"></span>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-brand-black">{t("shop.sortBy")}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-black">{t("shop.priceRange")}</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={t("shop.min")}
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value);
                        setCurrentPage(1);
                      }}
                      min="0"
                      step="0.01"
                    />
                    <Input
                      type="number"
                      placeholder={t("shop.max")}
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value);
                        setCurrentPage(1);
                      }}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-black">{t("shop.sortBy")}</label>
                  <Select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="newest">{t("shop.newestFirst")}</option>
                    <option value="oldest">{t("shop.oldestFirst")}</option>
                    <option value="price-asc">{t("shop.priceLowToHigh")}</option>
                    <option value="price-desc">{t("shop.priceHighToLow")}</option>
                    <option value="name-asc">{t("shop.nameAtoZ")}</option>
                    <option value="name-desc">{t("shop.nameZtoA")}</option>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      {t("shop.clearFilters")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
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
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">{t("products.noProductsFound")}</p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline">
                  {t("shop.clearFilters")}
                </Button>
              )}
            </div>
          ) : (
            <>
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

      <ProductReviews showcasingSection="nudes" />

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
              {t("productPagesExtended.coloursWhitesNudes.videoSection.title")}
            </h3>
            <p className="text-lg md:text-xl mb-6 max-w-2xl font-light">
              {t("productPagesExtended.coloursWhitesNudes.videoSection.description")}
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
                {t("productPagesExtended.coloursWhitesNudes.videoSection.cta")}
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

