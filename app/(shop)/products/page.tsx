"use client";

// Force dynamic rendering - this page uses searchParams
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { HeroSlider } from "@/components/layout/hero-slider";
import { ProductReviews } from "@/components/product/product-reviews";
import { useLanguage } from "@/contexts/language-context";

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
  rating?: number;
  reviewCount?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function ProductsPageContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("categoryId")
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [minPrice, setMinPrice] = useState(
    searchParams.get("minPrice") || ""
  );
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get("maxPrice") || ""
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "newest"
  );
  const [showFeatured, setShowFeatured] = useState(
    searchParams.get("featured") === "true"
  );
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const slides = [
    {
      type: "video" as const,
      src: "/moodywo4.mp4",
      overlayImage: "/MoodyJewels.png",
    },
    {
      type: "video" as const,
      src: "/buildervid.mp4",
      overlayImage: "/builderg.png",
    },
  ];

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([]);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append("categoryId", selectedCategory);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (minPrice) {
        params.append("minPrice", minPrice);
      }
      if (maxPrice) {
        params.append("maxPrice", maxPrice);
      }
      if (sortBy) {
        params.append("sortBy", sortBy);
      }
      if (showFeatured) {
        params.append("featured", "true");
      }
      params.append("page", currentPage.toString());
      params.append("limit", "12");
      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalProducts(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, minPrice, maxPrice, sortBy, showFeatured, currentPage]);

  useEffect(() => {
    fetchCategories();
    // Read all filter params from URL on mount
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const min = searchParams.get("minPrice");
    const max = searchParams.get("maxPrice");
    const sort = searchParams.get("sortBy");
    const featured = searchParams.get("featured");
    
    if (categoryId) setSelectedCategory(categoryId);
    if (search) setSearchQuery(search);
    if (min) setMinPrice(min);
    if (max) setMaxPrice(max);
    if (sort) setSortBy(sort);
    if (featured === "true") setShowFeatured(true);
  }, [searchParams, fetchCategories]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("categoryId", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sortBy && sortBy !== "newest") params.set("sortBy", sortBy);
    if (showFeatured) params.set("featured", "true");
    if (currentPage > 1) params.set("page", currentPage.toString());
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [selectedCategory, searchQuery, minPrice, maxPrice, sortBy, showFeatured, currentPage, pathname, router]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [selectedCategory, searchQuery, minPrice, maxPrice, sortBy, showFeatured]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery, minPrice, maxPrice, sortBy, showFeatured, currentPage]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setShowFeatured(false);
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedCategory || searchQuery || minPrice || maxPrice || sortBy !== "newest" || showFeatured;

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-[300px] sm:h-[400px] md:h-[500px]" />
      <div className="bg-brand-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-brand-black">{t("shop.title")}</h1>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {t("shop.filters")}
                {hasActiveFilters && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-light bg-brand-champagne text-brand-white rounded-full">
                    {[selectedCategory, searchQuery, minPrice, maxPrice, showFeatured].filter(Boolean).length}
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="text-sm"
                >
                  {t("shop.clearAll")}
                </Button>
              )}
            </div>
          </div>

          {/* Search and Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1">
              <Input
                placeholder={t("shop.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className={selectedCategory === null ? "bg-brand-champagne hover:bg-brand-champagne/90 text-brand-white whitespace-nowrap" : "whitespace-nowrap"}
              >
                {t("shop.all")}
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? "bg-brand-champagne hover:bg-brand-champagne/90 text-brand-white whitespace-nowrap" : "whitespace-nowrap"}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-brand-white border border-brand-champagne/30 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-black">{t("shop.priceRange")}</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={t("shop.min")}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                    <Input
                      type="number"
                      placeholder={t("shop.max")}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-black">{t("shop.sortBy")}</label>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">{t("shop.newestFirst")}</option>
                    <option value="oldest">{t("shop.oldestFirst")}</option>
                    <option value="price-asc">{t("shop.priceLowToHigh")}</option>
                    <option value="price-desc">{t("shop.priceHighToLow")}</option>
                    <option value="name-asc">{t("shop.nameAtoZ")}</option>
                    <option value="name-desc">{t("shop.nameZtoA")}</option>
                  </Select>
                </div>

                {/* Featured Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-black">{t("shop.options")}</label>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={showFeatured}
                      onChange={(e) => setShowFeatured(e.target.checked)}
                      className="w-4 h-4 text-brand-champagne border-brand-champagne/30 rounded focus:ring-brand-champagne focus:ring-2"
                    />
                    <label htmlFor="featured" className="text-sm font-light text-brand-black cursor-pointer">
                      {t("shop.featuredOnly")}
                    </label>
                  </div>
                </div>

                {/* Active Filters Summary */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-black">{t("shop.activeFilters")}</label>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedCategory && (
                      <span className="px-2 py-1 text-xs font-light bg-brand-champagne/20 text-brand-black rounded">
                        {categories.find(c => c.id === selectedCategory)?.name || "Category"}
                      </span>
                    )}
                    {minPrice && (
                      <span className="px-2 py-1 text-xs font-light bg-brand-champagne/20 text-brand-black rounded">
                        Min: £{minPrice}
                      </span>
                    )}
                    {maxPrice && (
                      <span className="px-2 py-1 text-xs font-light bg-brand-champagne/20 text-brand-black rounded">
                        Max: £{maxPrice}
                      </span>
                    )}
                    {showFeatured && (
                      <span className="px-2 py-1 text-xs font-light bg-brand-champagne/20 text-brand-black rounded">
                        Featured
                      </span>
                    )}
                    {!hasActiveFilters && (
                      <span className="text-xs font-light text-brand-champagne/60">{t("shop.noFiltersApplied")}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sort and Results Count - Always Visible */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
            {totalProducts > 0 && (
              <div className="text-xs sm:text-sm font-light text-brand-black">
                {t("shop.showing")} {((currentPage - 1) * 12) + 1} {t("shop.to")} {Math.min(currentPage * 12, totalProducts)} {t("shop.of")} {totalProducts} {t("shop.products")}
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm font-medium text-brand-black">{t("shop.sort")}</label>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="newest">{t("shop.newestFirst")}</option>
                <option value="oldest">{t("shop.oldestFirst")}</option>
                <option value="price-asc">{t("shop.priceLowToHigh")}</option>
                <option value="price-desc">{t("shop.priceHighToLow")}</option>
                <option value="name-asc">{t("shop.nameAtoZ")}</option>
                <option value="name-desc">{t("shop.nameZtoA")}</option>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-brand-black font-light">{t("shop.loadingProducts")}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-brand-black mb-4 font-light">{t("shop.noProductsFound")}</p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  {t("shop.clearFiltersToSeeAll")}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
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
                    description={product.description}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                  />
                ))}
              </div>
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>

        {/* Product Reviews Section */}
        <div className="mt-20 pt-12 border-t border-gray-200">
          <ProductReviews categoryId={selectedCategory || undefined} />
        </div>
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="bg-brand-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center py-12 text-brand-black font-light">Loading products...</div>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}

