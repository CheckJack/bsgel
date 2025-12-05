"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { HeroSlider } from "@/components/layout/hero-slider";
import { IngredientSlider } from "@/components/product/ingredient-slider";
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

export default function TreatmentGelsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const textSectionRef = useRef<HTMLElement>(null);
  const productsSectionRef = useRef<HTMLElement>(null);

  const slides = [
    {
      type: "video" as const,
      src: "/hjbuy.mp4",
      overlayImage: "/biologo.png",
      title: "Treatment Gels",
      description: "Discover our premium line of Treatment Gels",
    },
  ];

  useEffect(() => {
    fetchTreatmentGelProducts();
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

  const fetchTreatmentGelProducts = async () => {
    setIsLoading(true);
    try {
      // Search for products with "treatment gel" or "treatment" in the name
      const res = await fetch(`/api/products?search=treatment gel`);
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : data.products || []);
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
      id: "almond",
      name: "Almond",
      image: "/jojoba (13).png",
      whyWeUseIt: "Used because it is a very gentle, well-tolerated emollient that absorbs easily into skin and nails. Softens cuticles, reduces dryness and flaking, and helps improve flexibility of the nail plate to reduce splitting.",
      benefits: [],
      backgroundColor: "#7b3615",
      textColor: "#FFFFFF"
    },
    {
      id: "jojoba",
      name: "Jojoba",
      image: "/Add a heading (13).png",
      whyWeUseIt: "Its structure is a liquid wax ester, very similar to human sebum, so it is well tolerated and absorbs quickly without greasiness. It can carry small, oil-soluble molecules (like vitamin E) into the nail plate, improving how well conditioning ingredients are absorbed.",
      benefits: [],
      backgroundColor: "#ef7f28",
      textColor: "#FFFFFF"
    },
    {
      id: "avocado",
      name: "Avocado",
      image: "/dsd.png",
      whyWeUseIt: "It is high in fatty acids (like oleic acid) and vitamins, especially vitamin E, which moisturise and condition dry nails and skin. Its molecules can move into the superficial nail layers and act as a \"plasticiser,\" helping nail layers slide instead of crack.",
      benefits: [],
      backgroundColor: "#aeb54d",
      textColor: "#FFFFFF"
    },
    {
      id: "kiwi",
      name: "Kiwi",
      image: "/jojoba (8).png",
      whyWeUseIt: "Kiwi is naturally rich in vitamin C, vitamin E and antioxidants, which support skin and nail health and help protect against environmental damage. Enzymes and fruit acids from kiwi help loosen and remove dead surface cells in a mild way, preparing the nail and cuticle for better absorption of oils and treatments.",
      benefits: [],
      backgroundColor: "#815532",
      textColor: "#FFFFFF"
    },
    {
      id: "passion-fruit",
      name: "Passion Fruit",
      image: "/fawa.png",
      whyWeUseIt: "The seed oil is rich in linoleic and oleic acids plus vitamins A and E, so it delivers nourishing, moisturising and soothing effects while staying very light in texture. In some BIO Gel products it also appears as passion fruit seed powder for mild exfoliation, helping remove dry surface cells so treatments absorb better.",
      benefits: [],
      backgroundColor: "#eba725",
      textColor: "#FFFFFF"
    },
    {
      id: "ginseng-root",
      name: "Ginseng Root",
      image: "/jojoba (6).png",
      whyWeUseIt: "Ginseng root extract helps stimulate local micro-circulation, so more oxygen and nutrients reach the nail matrix and surrounding skin, which can support better nail growth quality. It has antioxidant and anti-inflammatory compounds (ginsenosides) that protect the nail area from oxidative stress and help calm irritation around the cuticle.",
      benefits: [],
      backgroundColor: "#c39f6e",
      textColor: "#FFFFFF"
    },
    {
      id: "jasmine",
      name: "Jasmine",
      image: "/jojoba (4).png",
      whyWeUseIt: "Used mainly for its soothing, aromatic and conditioning properties in cuticle oils. Helps comfort sensitive cuticles, adds mild moisturising, and makes treatments feel more luxurious and spa‑like.​",
      benefits: [],
      backgroundColor: "#422e55",
      textColor: "#FFFFFF"
    },
    {
      id: "sunflower-seed",
      name: "Sunflower Seed",
      image: "/jojoba (3).png",
      whyWeUseIt: "Used as a lightweight base oil that carries other actives and adds essential fatty acids. Moisturises without feeling greasy, supports the skin barrier around the nail, and helps protect against environmental dryness.",
      benefits: [],
      backgroundColor: "#351d0c",
      textColor: "#FFFFFF",
      imageSize: "70%"
    }
  ];

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
                words="Treatment Gels represent the therapeutic essence of our BIO Gel collection, specifically formulated to address and improve various nail conditions. These specialized gels combine advanced gel technology with targeted active ingredients to provide healing, strengthening, and restorative benefits. Whether you're dealing with brittle nails, damaged cuticles, or seeking enhanced nail health, our Treatment Gels deliver professional-grade care that nurtures while it beautifies. Experience the perfect balance of treatment and aesthetics with our premium Treatment Gel range. #our-funds"
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
      <section className="relative w-full h-screen bg-brand-white">
        {/* Ingredient Slider */}
        <IngredientSlider ingredients={ingredients} />
      </section>
      
      {/* Treatment Gel Products Grid Section */}
      <section ref={productsSectionRef} className="relative w-full min-h-screen bg-brand-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-4xl md:text-5xl font-medium mb-12 text-center text-brand-black">
            Treatment Gel Products
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No Treatment Gel products found.</p>
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

