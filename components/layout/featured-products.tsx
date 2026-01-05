"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/product/product-card";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

interface Product {
  id: string;
  name: string;
  price: string;
  image: string | null;
  images?: string[];
  featured?: boolean;
  description?: string | null;
  rating?: number;
  reviewCount?: number;
}

export function FeaturedProducts() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const res = await fetch("/api/products?featured=true&limit=20");
        if (res.ok) {
          const data = await res.json();
          // Ensure price is formatted as string
          const formattedProducts = (data.products || []).map((product: any) => ({
            ...product,
            price: product.price?.toString() || "0",
          }));
          
          // Filter to show only these 4 specific products
          const allowedProducts = [
            'Peach Pitstop Gel Polish',
            'Tracey Gel Polish',
            'Nourishing Cuticle Oil',
            'Apricot Kernel Scrub'
          ];
          
          const filteredProducts = formattedProducts.filter((product: Product) =>
            allowedProducts.includes(product.name)
          );
          
          setProducts(filteredProducts);
        }
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (isLoading) {
    return (
      <section className="w-full py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="container mx-auto max-w-[1920px]">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-brand-black mb-4 tracking-tight">
              {t("home.featuredProducts")}
            </h2>
          </div>
          <div className="text-center py-12 text-brand-black font-light">
            {t("home.loadingProducts")}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 sm:py-20 px-4 sm:px-6 bg-white">
      <div className="container mx-auto max-w-[1920px]">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-brand-black mb-4 tracking-tight">
            {t("home.featuredProducts")}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto font-light">
            {t("home.featuredProductsDesc")}
          </p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-brand-black font-light text-lg mb-4">{t("home.noFeaturedProducts")}</p>
            <Link
              href="/products"
              className="inline-flex items-center text-brand-black hover:text-brand-champagne font-medium text-base sm:text-lg transition-colors duration-300 font-light"
            >
              <span className="mr-2">{t("home.viewAllProducts")}</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.image}
                  images={product.images}
                  featured={product.featured}
                  description={product.description}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                />
              ))}
            </div>

            {/* View All Link */}
            <div className="text-center mt-12">
              <Link
                href="/products?featured=true"
                className="inline-flex items-center text-brand-black hover:text-brand-champagne font-medium text-base sm:text-lg transition-colors duration-300 font-light"
              >
                <span className="mr-2">{t("home.viewAllFeaturedProducts")}</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

