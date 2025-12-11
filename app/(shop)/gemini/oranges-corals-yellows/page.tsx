"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import TextGenerateEffect from "@/components/ui/text-generate-effect";
import { Pagination } from "@/components/ui/pagination";

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
}

export default function OrangesCoralsYellowsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isScrolling, setIsScrolling] = useState(false);
  const textSectionRef = useRef<HTMLElement>(null);
  const productsSectionRef = useRef<HTMLElement>(null);
  const isInitialMount = useRef(true);
  const [shouldShowId, setShouldShowId] = useState(false);

  useEffect(() => {
    fetchProducts();
    // Add id after component mounts to prevent browser auto-scroll
    const timer = setTimeout(() => {
      setShouldShowId(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentPage]);


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

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Fetch products assigned to oranges showcasing section with pagination
      const res = await fetch(`/api/products?showcasingSection=oranges&page=${currentPage}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        if (data.pagination) {
          setProducts(data.products || []);
          setTotalPages(data.pagination.totalPages || 1);
        } else {
          // Fallback for backward compatibility
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
      {/* Prevent automatic scroll to #products - runs immediately before React */}
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
      {/* Custom Hero Section - Promotional Style */}
      <section className="relative w-full aspect-[1366/768] overflow-hidden">
        {/* Full Width Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/sffsfssfxc.png"
            alt="Gemini Oranges Corals Yellows Collection"
            fill
            className="object-contain object-center"
            priority
            sizes="100vw"
          />
        </div>
        
        {/* Text Content Overlay - Left Aligned */}
        <div className="relative z-10 w-full h-full flex items-center">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="max-w-2xl">
              <div className="text-white space-y-1">
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  Discover our vibrant collection
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  of Orange, Coral, and Yellow
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  shades in the Gemini collection.
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  From sunny yellows to vibrant
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  corals, warmth and energy.
                </p>
              </div>
              
              {/* SHOP NOW Button */}
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
                <button className="px-5 py-2 md:px-6 md:py-2.5 border-2 border-white text-white font-normal text-sm md:text-base hover:bg-white/10 transition-colors">
                  SHOP NOW
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <section 
        ref={textSectionRef}
        id="our-funds"
        className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] bg-brand-white"
      >
        <div className="w-full h-full flex items-center">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center">
              <TextGenerateEffect
                words="Oranges, Corals, and Yellows bring warmth and energy to our Gemini collection. From sunny yellows to vibrant corals and rich oranges, these shades capture the essence of summer and add a cheerful pop of color to any look. Each gel delivers bright, saturated color with excellent coverage and long-lasting wear. Whether you prefer a soft peach, a bold tangerine, or a sunny yellow, our collection offers vibrant options that radiate positivity and style. #our-funds"
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
      
      <section {...(shouldShowId && { id: "products" })} ref={productsSectionRef} className="relative w-full min-h-screen bg-brand-white pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-4xl md:text-5xl font-medium mb-12 text-center text-brand-black">
            Orange, Coral & Yellow Shades
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No products found.</p>
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

      <ProductReviews />

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

