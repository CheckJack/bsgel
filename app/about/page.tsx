"use client";

import { HeroSlider } from "@/components/layout/hero-slider";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";


function RotatingWordsSection() {
  const { t } = useLanguage();
  const words = [t("home.healthy"), t("home.quality"), t("home.longevity")];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out current word (1 second)
      setIsVisible(false);
      setTimeout(() => {
        // Change to next word while invisible
        setCurrentIndex((prev) => (prev + 1) % words.length);
        // Ensure it stays invisible initially
        setIsVisible(false);
        // Show blank for 2 seconds, then fade in slowly
        setTimeout(() => {
          // Fade in next word gradually (1 second transition)
          requestAnimationFrame(() => {
            setIsVisible(true);
          });
        }, 2000);
      }, 1000);
    }, 8000);

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section className="relative pt-32 pb-32 px-4 min-h-[60vh] flex items-center justify-center overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/dssfvszvx.mp4" type="video/mp4" />
      </video>
      <div className="relative z-10 text-center px-4">
        <div className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-medium text-brand-white" style={{ fontFamily: 'var(--font-jost), sans-serif' }}>
          <span className="inline-block relative min-w-[200px] sm:min-w-[300px] md:min-w-[400px] lg:min-w-[500px] xl:min-w-[600px] h-[1.2em]">
            <span
              key={currentIndex}
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ease-in-out"
              style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 1s ease-in-out'
              }}
            >
              {words[currentIndex]}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  const { t } = useLanguage();

  const slides = [
    {
      type: "video" as const,
      src: "/1204 (3.mp4",
    },
  ];

  return (
    <>
      <HeroSlider slides={slides} autoPlayInterval={5000} className="h-screen" showDarkOverlay={false} />
      <div className="min-h-screen bg-brand-white">

      {/* Mission Section */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 flex items-center">
        <div className="container mx-auto w-full">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-light text-brand-black text-center leading-relaxed w-full px-4 sm:px-6 md:px-8">
            {t("about.mission")}
          </p>
        </div>
      </section>

      {/* Rotating Words Section */}
      <RotatingWordsSection />
      </div>
    </>
  );
}

