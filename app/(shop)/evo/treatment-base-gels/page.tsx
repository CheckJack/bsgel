"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import TextGenerateEffect from "@/components/ui/text-generate-effect";

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

export default function TreatmentBaseGelsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const textSectionRef = useRef<HTMLElement>(null);
  const productsSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchTreatmentBaseGelProducts();
  }, []);

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

  const fetchTreatmentBaseGelProducts = async () => {
    setIsLoading(true);
    try {
      // Fetch products assigned to treatment-gels showcasing section
      const res = await fetch(`/api/products?showcasingSection=treatment-gels`);
      if (res.ok) {
        const data = await res.json();
        const allProducts = Array.isArray(data) ? data : data.products || [];
        setProducts(allProducts);
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
      {/* Custom Hero Section - Promotional Style */}
      <section className="relative w-full aspect-[1366/768] overflow-hidden">
        {/* Full Width Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/erwt3q.png"
            alt="Evo Treatment Base Gels Collection"
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
                  Discover our premium Treatment Base
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  Gels collection. The foundation of
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  a perfect EVO manicure, providing
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  essential therapeutic benefits with
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-normal leading-tight">
                  treatment and performance.
                </p>
              </div>
              
              {/* SHOP NOW Button */}
              <Link href="#products" className="inline-block mt-8">
                <button className="px-5 py-2 md:px-6 md:py-2.5 border-2 border-white text-white font-normal text-sm md:text-base hover:bg-white/10 transition-colors">
                  SHOP NOW
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
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
                words="Treatment Base Gels are the foundation of a perfect EVO manicure, providing essential therapeutic benefits while creating the ideal base for color application. These specialized gels combine treatment properties with base coat functionality, ensuring your nails receive nourishment and protection from the very first layer. Formulated with strengthening and conditioning ingredients, our Treatment Base Gels help improve nail health, prevent staining, and extend the longevity of your manicure. Experience the perfect combination of treatment and performance with our premium Treatment Base Gels. #our-funds"
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
      
      {/* Treatment Base Gel Products Grid Section */}
      <section ref={productsSectionRef} id="products" className="relative w-full min-h-screen bg-brand-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-4xl md:text-5xl font-medium mb-12 text-center text-brand-black">
            Treatment Base Gel Products
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No Treatment Base Gel products found.</p>
            </div>
          ) : (
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
          )}
        </div>
      </section>

      {/* Product Reviews Section */}
      <ProductReviews />

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

