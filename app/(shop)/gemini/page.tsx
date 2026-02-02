"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { HeroSlider } from "@/components/layout/hero-slider";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import TextGenerateEffect from "@/components/ui/text-generate-effect";
import { useLanguage } from "@/contexts/language-context";
import { Pagination } from "@/components/ui/pagination";

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

export default function GeminiPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isScrolling, setIsScrolling] = useState(false);
  const textSectionRef = useRef<HTMLElement>(null);
  const productsSectionRef = useRef<HTMLElement>(null);
  const isInitialMount = useRef(true);

  const slides = [
    {
      type: "video" as const,
      src: "/Lavender Base (2).mp4",
      overlayImage: "/geminilogo.png",
      title: "",
      description: "",
    },
  ];

  useEffect(() => {
    fetchGeminiProducts();
  }, [currentPage]);



  // Scroll detection for text highlighting
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let isScrollingActive = false;

    const handleScroll = () => {
      if (!isScrollingActive) {
        setIsScrolling(true);
        isScrollingActive = true;
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
        isScrollingActive = false;
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const fetchGeminiProducts = async () => {
    setIsLoading(true);
    try {
      // Fetch products with "gemini" showcasing section
      const params = new URLSearchParams({
        showcasingSection: "gemini",
        page: currentPage.toString(),
        limit: "10",
      });

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
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-screen" showDarkOverlay={false} scrollControlled={true} />
      
      {/* Text Section with Scroll-Triggered Highlighting */}
      <section 
        ref={textSectionRef}
        id="our-funds"
        className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] bg-brand-white"
      >
        <div className="w-full h-full flex items-center">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center">
              <TextGenerateEffect
                words={`${t("productPages.gemini.description")} #our-funds`}
                className="text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-brand-black leading-relaxed font-normal"
                filter={true}
                duration={0.5}
                triggerOnScroll={true}
                isScrolling={isScrolling}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Gemini Products Grid Section */}
      <section ref={productsSectionRef} className="relative w-full min-h-screen bg-brand-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-4xl md:text-5xl font-medium mb-12 text-center text-brand-black">
            {t("productPages.geminiProducts")}
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("productPages.loadingProducts")}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("productPages.noGeminiProducts")}</p>
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
      <ProductReviews showcasingSection="gemini" />

      {/* Full Width Video Background Section */}
      <section className="relative w-full h-screen overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/Lavender Base (2).mp4" type="video/mp4" />
        </video>
      </section>

    </>
  );
}

