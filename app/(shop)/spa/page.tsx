"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { HeroSlider } from "@/components/layout/hero-slider";
import { IngredientSlider } from "@/components/product/ingredient-slider";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import TextGenerateEffect from "@/components/ui/text-generate-effect";
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

export default function SpaPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [isScrolling, setIsScrolling] = useState(false);
  const textSectionRef = useRef<HTMLElement>(null);
  const productsSectionRef = useRef<HTMLElement>(null);
  const bottomVideoRef = useRef<HTMLVideoElement>(null);

  const slides = [
    {
      type: "video" as const,
      src: "/GDSDSDSBDSBDS.mp4",
      title: "SPA",
      description: t("productPages.spa.heroDescription"),
    },
  ];

  useEffect(() => {
    fetchSpaProducts();
  }, []);

  // Ensure bottom video plays
  useEffect(() => {
    if (bottomVideoRef.current) {
      bottomVideoRef.current.play().catch((error) => {
        console.error("Video autoplay failed:", error);
      });
    }
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

  const fetchSpaProducts = async () => {
    setIsLoading(true);
    try {
      // First, try to find a "SPA" category
      const categoriesRes = await fetch("/api/categories");
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        const spaCategory = categoriesData.categories?.find(
          (cat: { name: string }) => cat.name.toLowerCase() === "spa"
        );

        if (spaCategory) {
          setCategoryId(spaCategory.id);
          // If category exists, fetch all products in that category
          const res = await fetch(`/api/products?categoryId=${spaCategory.id}`);
          if (res.ok) {
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : data.products || []);
          }
        } else {
          // Otherwise, search for products with "spa" in the name
          const res = await fetch(`/api/products?search=spa`);
          if (res.ok) {
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : data.products || []);
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

  // Ingredients data for the slider
  const ingredients = [
    {
      id: "cocoa-butter",
      name: "Manteiga de Cacau",
      image: "/DSGVSDVDSXZVXZB (1).png",
      whyWeUseIt: "A Manteiga de Cacau (Theobroma Cacao Seed Butter) é um hidratante natural poderoso para a pele, rico em antioxidantes e ácidos gordos, que nutre profundamente, melhora a elasticidade, protege contra a desidratação e ajuda a regenerar.",
      benefits: [],
      backgroundColor: "#7b3615",
      textColor: "#FFFFFF"
    },
    {
      id: "coconut-oil",
      name: "Óleo de Coco",
      image: "/DSGGDSDGS.png",
      whyWeUseIt: "O óleo de coco é um excelente hidratante natural, ideal para peles secas, maduras e irritadas, pois suaviza, acalma e nutre profundamente.",
      benefits: [],
      backgroundColor: "#8B6F47",
      textColor: "#FFFFFF",
      imageSize: "100%",
      whyWeUseItHeading: "Porque o utilizamos?"
    },
    {
      id: "shea-butter",
      name: "Manteiga de Karité",
      image: "/VDDSVDS.png",
      whyWeUseIt: "A manteiga de karité oferece hidratação profunda e duradoura, nutrindo intensamente a pele e as cutículas. Rica em vitaminas A, E e F, que ajuda na regeneração e reparação da pele, melhora a elasticidade e cria uma proteção natural contra agressões externas.",
      benefits: [],
      backgroundColor: "#6B4E3D",
      textColor: "#FFFFFF",
      imageSize: "120%"
    }
  ];

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-screen" showDarkOverlay={false} scrollControlled={false} />
      
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
                words={t("productPages.spa.description")}
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

      {/* Natural & Organic Ingredients Section */}
      <IngredientSlider ingredients={ingredients} />

      {/* SPA Products Grid Section */}
      <section ref={productsSectionRef} className="relative w-full min-h-screen bg-brand-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-4xl md:text-5xl font-medium mb-12 text-center text-brand-black">
            {t("productPages.spaProducts")}
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("productPages.loadingProducts")}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t("productPages.noSpaProducts")}</p>
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
                  outOfStock={(product as any).outOfStock}
                  hemaFree={(product as any).hemaFree}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Reviews Section */}
      <ProductReviews categoryId={categoryId} />

      {/* Full Width Video Background Section */}
      <section className="relative w-full h-screen overflow-hidden">
        <video
          ref={bottomVideoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/srgsdhdsh.mp4" type="video/mp4" />
        </video>
      </section>

    </>
  );
}

