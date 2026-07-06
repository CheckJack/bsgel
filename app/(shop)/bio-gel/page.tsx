"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CategoryHeroBadge } from "@/components/layout/category-hero-badge";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { ShopProductsHeader } from "@/components/shop/shop-products-header";
import { ShopProductsTitle } from "@/components/shop/shop-products-title";
import { ShopEmptyProducts } from "@/components/shop/shop-empty-products";
import { Pagination } from "@/components/ui/pagination";
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

export default function BioGelPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const filters = useShopFilters();

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.sortBy, filters.minPrice, filters.maxPrice, filters.showFeatured]);

  useEffect(() => {
    fetchBioGelProducts();
  }, [currentPage, filters.sortBy, filters.minPrice, filters.maxPrice, filters.showFeatured]);

  const fetchBioGelProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });
      filters.appendToSearchParams(params);
      // First, try to find a "BIO Gel" category
      const categoriesData = { categories: await fetchShopCategories() };
      const bioGelCategory = categoriesData.categories?.find(
        (cat: { name: string }) => cat.name.toLowerCase() === "bio gel" || cat.name.toLowerCase() === "biogel"
      );

      if (bioGelCategory) {
        setCategoryId(bioGelCategory.id);
        params.set("categoryId", bioGelCategory.id);
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
      } else {
        params.set("search", "bio gel");
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
        <CategoryHeroBadge />
        <Image src="/j7j57qehr.png" alt="BIO Gel" fill className="object-cover lg:hidden" priority unoptimized />
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label="BIO Gel"
          className="absolute inset-0 hidden h-full w-full object-cover lg:block"
        >
          <source src="/bio-gel-hero.mp4" type="video/mp4" />
        </video>
      </section>

      <section id="products" className="relative w-full min-h-screen bg-brand-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <ShopProductsHeader
            filters={filters}
            title={
              <>
                <ShopProductsTitle>BIO Gel BIO Sculpture</ShopProductsTitle>
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
      <ProductReviews categoryId={categoryId} />
    </>
  );
}

