"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { useLanguage } from "@/contexts/language-context";

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
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchBioGelProducts();
  }, [currentPage, sortBy]);
  const fetchBioGelProducts = async () => {
    setIsLoading(true);
    try {
      // First, try to find a "BIO Gel" category
      const categoriesRes = await fetch("/api/categories");
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        const bioGelCategory = categoriesData.categories?.find(
          (cat: { name: string }) => cat.name.toLowerCase() === "bio gel" || cat.name.toLowerCase() === "biogel"
        );

        if (bioGelCategory) {
          setCategoryId(bioGelCategory.id);
          // If category exists, fetch all products in that category with pagination
          const res = await fetch(`/api/products?categoryId=${bioGelCategory.id}&page=${currentPage}&limit=10&sortBy=${encodeURIComponent(sortBy)}`);
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
          // Otherwise, search for products with "bio gel" or "biogel" in the name with pagination
          const res = await fetch(`/api/products?search=bio gel&page=${currentPage}&limit=10&sortBy=${encodeURIComponent(sortBy)}`);
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
        <Image src="/bio-gel-hero.svg" alt="BIO Gel" fill className="object-cover" priority unoptimized />
        <div className="relative z-10 flex h-full items-center">
          <div className="container mx-auto flex h-full max-w-7xl items-center px-4">
            <h1 className="text-4xl font-medium text-white sm:text-5xl md:text-6xl">BIO Gel</h1>
          </div>
        </div>
      </section>

      <section id="products" className="relative w-full min-h-screen bg-brand-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-medium text-brand-black sm:text-3xl md:text-4xl">
                BIO Gel BIO Sculpture
              </h2>
              <div className="mt-3 h-1 w-16 bg-brand-champagne"></div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-brand-black">{t("shop.sortBy")}</label>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-48">
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
            <div className="text-center py-12">
              <p className="text-gray-600">{t("productPages.loadingProducts")}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("productPages.noBioGelProducts")}</p>
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

      {/* Product Reviews Section */}
      <ProductReviews categoryId={categoryId} />
    </>
  );
}

