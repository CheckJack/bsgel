"use client";

import { useEffect, useState, useRef } from "react";
import { HeroSlider } from "@/components/layout/hero-slider";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { NailDiagnosisModal } from "@/components/ui/nail-diagnosis-modal";
import TextGenerateEffect from "@/components/ui/text-generate-effect";
import { Pagination } from "@/components/ui/pagination";
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
  const [isScrolling, setIsScrolling] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const textSectionRef = useRef<HTMLElement>(null);
  const productsSectionRef = useRef<HTMLElement>(null);
  const isInitialMount = useRef(true);

  const slides = [
    {
      type: "video" as const,
      src: "/hjbuy.mp4",
      title: "BIO Gel",
      description: t("productPages.bioGel.heroDescription"),
    },
  ];

  useEffect(() => {
    fetchBioGelProducts();
  }, [currentPage]);


  // Intersection Observer for showing diagnosis modal when products section is visible
  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let lastShownTime = 0;
    
    const timer = setTimeout(() => {
      if (!productsSectionRef.current) return;

      // Check if user has already interacted with the modal in this session
      const hasInteracted = sessionStorage.getItem("bio-gel-modal-interacted") === "true";
      if (hasInteracted) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // Check again in case user interacted while scrolling
            const hasInteractedNow = sessionStorage.getItem("bio-gel-modal-interacted") === "true";
            if (hasInteractedNow) return;

            // Show modal when section is visible, but wait at least 2 seconds between shows
            const now = Date.now();
            if (entry.isIntersecting && (now - lastShownTime > 2000)) {
              setShowDiagnosisModal(true);
              lastShownTime = now;
            }
          });
        },
        {
          threshold: 0.2, // Trigger when 20% of the section is visible
          rootMargin: "0px",
        }
      );

      observer.observe(productsSectionRef.current);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (observer && productsSectionRef.current) {
        observer.unobserve(productsSectionRef.current);
      }
    };
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
          const res = await fetch(`/api/products?categoryId=${bioGelCategory.id}&page=${currentPage}&limit=10`);
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
          const res = await fetch(`/api/products?search=bio gel&page=${currentPage}&limit=10`);
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
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-screen" showDarkOverlay={false} scrollControlled={true} />
      
      {/* Text Section with Scroll-Triggered Highlighting */}
      <section 
        ref={textSectionRef}
        id="our-funds"
        className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] bg-brand-white"
      >
        <div className="w-full h-full flex items-center">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center">
              <TextGenerateEffect
                words={t("productPages.bioGel.description")}
                className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-brand-black leading-relaxed font-normal"
                filter={true}
                duration={0.5}
                triggerOnScroll={true}
                isScrolling={isScrolling}
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* BIO Gel Products Grid Section */}
      <section ref={productsSectionRef} className="relative w-full min-h-screen bg-brand-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium mb-8 sm:mb-12 text-center text-brand-black">
            {t("productPages.bioGelProducts")}
          </h2>
          
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

      {/* Nail Diagnosis Modal */}
      <NailDiagnosisModal 
        isOpen={showDiagnosisModal} 
        onClose={() => {
          setShowDiagnosisModal(false);
          // Mark as interacted in sessionStorage so it won't show again this session
          sessionStorage.setItem("bio-gel-modal-interacted", "true");
        }}
        onParticipate={() => {
          // Mark as interacted in sessionStorage so it won't show again this session
          sessionStorage.setItem("bio-gel-modal-interacted", "true");
        }}
      />
    </>
  );
}

