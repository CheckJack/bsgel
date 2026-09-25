"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { ProductReviews } from "@/components/product/product-reviews";
import { ShopEmptyProducts } from "@/components/shop/shop-empty-products";
import { useLanguage } from "@/contexts/language-context";
import type { ProductListItem } from "@/lib/products/get-product-list";

interface Product {
  id: string;
  slug?: string;
  name: string;
  description?: string | null;
  price: string;
  salePrice?: string | null;
  image: string | null;
  images?: string[];
  featured: boolean;
  category: {
    id: string;
    name: string;
  } | null;
  rating?: number;
  reviewCount?: number;
  outOfStock?: boolean;
  hemaFree?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

type ProductsPageClientProps = {
  initialProducts: ProductListItem[];
  initialPage: number;
  initialTotalPages: number;
  initialTotal: number;
  initialCategories: Category[];
  initialCategoryId: string | null;
  initialSearch: string;
  initialMinPrice: string;
  initialMaxPrice: string;
  initialSortBy: string;
  initialFeatured: boolean;
};

export function ProductsPageClient({
  initialProducts,
  initialPage,
  initialTotalPages,
  initialTotal,
  initialCategories,
  initialCategoryId,
  initialSearch,
  initialMinPrice,
  initialMaxPrice,
  initialSortBy,
  initialFeatured,
}: ProductsPageClientProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories] = useState<Category[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategoryId);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [showFeatured, setShowFeatured] = useState(initialFeatured);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalProducts, setTotalProducts] = useState(initialTotal);
  const skipNextFetch = useRef(true);
  const skipPageReset = useRef(true);

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
    if (skipPageReset.current) {
      skipPageReset.current = false;
      return;
    }
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, minPrice, maxPrice, sortBy, showFeatured]);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!showFilters) return;
    const scrollRoot = document.querySelector(".app-scroll-root") as HTMLElement | null;
    const previousBody = document.body.style.overflow;
    const previousRoot = scrollRoot?.style.overflowY ?? "";
    document.body.style.overflow = "hidden";
    if (scrollRoot) scrollRoot.style.overflowY = "hidden";
    return () => {
      document.body.style.overflow = previousBody;
      if (scrollRoot) scrollRoot.style.overflowY = previousRoot;
    };
  }, [showFilters]);

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
      <div className="bg-brand-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
            <h1 className="font-display text-2xl font-normal tracking-tight text-brand-black sm:text-3xl md:text-4xl">{t("shop.title")}</h1>
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
          <div className="mb-4 rounded-lg border border-brand-champagne/20 bg-brand-white p-3 sm:mb-6 sm:p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_240px] sm:gap-4">
              <div>
                <Input
                  placeholder={t("shop.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm sm:text-base"
                />
              </div>
              <div>
                <Select
                  value={selectedCategory || "all"}
                  onChange={(e) => setSelectedCategory(e.target.value === "all" ? null : e.target.value)}
                  className="w-full"
                >
                  <option value="all">{t("shop.all")}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

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

          {products.length === 0 && !isLoading ? (
            <ShopEmptyProducts
              hasActiveFilters={Boolean(hasActiveFilters)}
              onClearFilters={clearFilters}
              browseHref="/products"
            />
          ) : products.length === 0 && isLoading ? (
            <div className="text-center py-12 text-brand-black font-light">{t("shop.loadingProducts")}</div>
          ) : (
            <>
              <div
                className={`grid grid-cols-1 justify-items-start gap-x-5 gap-y-12 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-3 lg:gap-x-12 ${
                  isLoading ? "pointer-events-none opacity-50" : ""
                }`}
              >
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    price={product.price}
                    salePrice={product.salePrice}
                    image={product.image}
                    images={product.images}
                    featured={product.featured}
                    outOfStock={(product as any).outOfStock}
                    hemaFree={(product as any).hemaFree}
                    description={product.description}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    priority={index < 3}
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

        {showFilters && (
          <div className="fixed inset-0 z-[120]">
            <button
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowFilters(false)}
              aria-label={t("common.close")}
            />
            <div className="absolute left-0 top-0 h-full w-full max-w-md overflow-y-auto bg-brand-white shadow-xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-champagne/20 bg-brand-white px-4 py-4 sm:px-6">
                <h2 className="text-xl font-medium text-brand-black">{t("shop.filters")}</h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="flex size-9 items-center justify-center rounded-full border border-black/10 text-brand-black transition-colors hover:border-brand-champagne hover:bg-brand-champagne/10"
                  aria-label={t("common.close")}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>

              <div className="space-y-6 px-4 py-5 sm:px-6">
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

              <div className="sticky bottom-0 border-t border-brand-champagne/20 bg-brand-white px-4 py-3 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <Button variant="outline" onClick={clearFilters}>
                    {t("shop.clearAll")}
                  </Button>
                  <Button onClick={() => setShowFilters(false)}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Reviews Section */}
        <div className="mt-20 pt-12 border-t border-gray-200">
          <ProductReviews categoryId={selectedCategory || undefined} />
        </div>
      </div>
    </>
  );
}

