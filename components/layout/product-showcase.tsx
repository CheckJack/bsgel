"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface ProductLine {
  image: string;
  title: string;
  description?: string;
  link?: string;
  logo?: string;
}

interface ProductShowcaseProps {
  products: ProductLine[];
}

export function ProductShowcase({ products }: ProductShowcaseProps) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [slidesToShow, setSlidesToShow] = useState(3);

  // Determine slides to show based on screen size
  useEffect(() => {
    const updateSlidesToShow = () => {
      if (window.innerWidth < 768) {
        setSlidesToShow(1);
      } else if (window.innerWidth < 1024) {
        setSlidesToShow(2);
      } else {
        setSlidesToShow(3);
      }
    };

    updateSlidesToShow();
    window.addEventListener('resize', updateSlidesToShow);
    return () => window.removeEventListener('resize', updateSlidesToShow);
  }, []);

  const maxIndex = Math.max(0, products.length - slidesToShow);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
  };

  // Auto-play slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
    }, 5000);

    return () => clearInterval(interval);
  }, [maxIndex]);

  return (
    <section className="w-full py-16 sm:py-20 px-4 sm:px-6 bg-white">
      <div className="container mx-auto max-w-[1920px]">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-brand-black mb-4 tracking-tight">
            {t("home.exploreCollections")}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            {t("home.exploreCollectionsDesc")}
          </p>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Arrows */}
          {products.length > slidesToShow && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 md:-translate-x-6 z-30 bg-white/90 hover:bg-white active:bg-white rounded-full p-2 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 group touch-manipulation min-w-[44px] min-h-[44px]"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-brand-black group-hover:text-brand-champagne transition-colors" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 md:translate-x-6 z-30 bg-white/90 hover:bg-white active:bg-white rounded-full p-2 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 group touch-manipulation min-w-[44px] min-h-[44px]"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-brand-black group-hover:text-brand-champagne transition-colors" />
              </button>
            </>
          )}

          {/* Slider Wrapper */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / slidesToShow)}%)`,
              }}
            >
              {products.map((product, index) => {
                const isHovered = hoveredIndex === index;
                const slideContent = (
                  <div
                    className="group relative h-[500px] sm:h-[550px] md:h-[600px] rounded-2xl overflow-hidden cursor-pointer bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-500"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                      {/* Image Container with proper aspect ratio */}
                      <div className="relative w-full h-full">
                        <div className="relative w-full h-full">
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            className={`object-cover transition-all duration-700 ${
                              isHovered ? "scale-110 brightness-75" : "scale-100 brightness-100"
                            }`}
                            sizes={`(max-width: 768px) 100vw, (max-width: 1024px) 50vw, ${100 / slidesToShow}vw`}
                            style={{ objectFit: 'cover' }}
                            priority={index < slidesToShow}
                            loading={index < slidesToShow ? undefined : "lazy"}
                          />
                        </div>
                        
                        {/* Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-500 ${
                          isHovered ? "opacity-100" : "opacity-60"
                        }`} />

                        {/* Content Overlay */}
                        <div className={`absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-20 transition-all duration-500 ${
                          isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-90"
                        }`}>
                          {/* Title */}
                          <h3 className={`text-2xl sm:text-3xl md:text-4xl font-medium text-white mb-3 transition-all duration-500 ${
                            isHovered ? "translate-y-0" : "translate-y-2"
                          }`}>
                            {product.title.toUpperCase()}
                          </h3>

                          {/* Description */}
                          {product.description && (
                            <p className={`text-white/90 text-sm sm:text-base mb-4 line-clamp-2 transition-all duration-500 delay-75 ${
                              isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                            }`}>
                              {product.description}
                            </p>
                          )}

                          {/* CTA Arrow */}
                          <div className={`flex items-center text-white font-medium text-sm sm:text-base transition-all duration-500 delay-100 ${
                            isHovered ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                          }`}>
                            <span className="mr-2">{t("home.exploreCollection")}</span>
                            <svg
                              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
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
                          </div>
                        </div>

                        {/* Hover Effect Border */}
                        <div className={`absolute inset-0 border-2 border-white/30 rounded-2xl transition-opacity duration-500 ${
                          isHovered ? "opacity-100" : "opacity-0"
                        }`} />
                      </div>
                    </div>
                );

                return (
                  <div
                    key={index}
                    className="flex-shrink-0 px-3 sm:px-4"
                    style={{ width: `${100 / slidesToShow}%` }}
                  >
                    {product.link ? (
                      <Link href={product.link} className="block">
                        {slideContent}
                      </Link>
                    ) : (
                      slideContent
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Optional: View All Link */}
        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center text-brand-black hover:text-brand-champagne font-medium text-base sm:text-lg transition-colors duration-300"
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
      </div>
    </section>
  );
}
