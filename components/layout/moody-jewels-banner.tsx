"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";

export function MoodyJewelsBanner() {
  const { t } = useLanguage();

  return (
    <section className="w-full relative overflow-hidden">
      <div className="relative w-full min-h-[500px] sm:min-h-[600px] md:min-h-[700px] lg:min-h-[800px] flex">
        {/* Full Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/Nova Coleção (1920 x 800 px).png"
            alt="Moody Jewels Collection"
            fill
            className="object-cover object-center lg:object-right"
            sizes="100vw"
            priority
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 container mx-auto max-w-[1920px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 flex items-center w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-0 w-full items-center">
            {/* Left Side - Text Content */}
            <div className="relative z-20 text-white py-8 sm:py-10 md:py-12 lg:py-16 w-full">
              {/* Logo */}
              <div className="mb-3 sm:mb-4 max-w-full sm:max-w-md md:max-w-lg">
                <Image
                  src="/dsvdsbsd.png"
                  alt="Moody Jewels Logo"
                  width={500}
                  height={200}
                  className="object-contain w-full h-auto"
                  priority
                />
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/95 mb-6 sm:mb-8 md:mb-10 max-w-full sm:max-w-md md:max-w-lg leading-relaxed font-light">
                {t("home.moodyJewelsDesc")}
              </p>

              {/* CTA Button */}
              <Link href="/gemini" className="inline-block">
                <button className="bg-black hover:bg-gray-900 active:bg-gray-800 text-white px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4 rounded-lg transition-all duration-300 font-medium text-xs sm:text-sm md:text-base shadow-lg hover:shadow-xl touch-manipulation min-h-[44px] w-full sm:w-auto">
                  {t("common.learnMore")}
                </button>
              </Link>
            </div>

            {/* Right Side - Image Area (nail polish bottles are in the background image) */}
            <div className="hidden lg:block relative h-full min-h-[600px]" />
          </div>
        </div>

        {/* Top Right Tag - NOVA COLEÇÃO */}
        <div className="absolute top-4 right-3 sm:top-6 sm:right-4 md:top-8 md:right-6 lg:top-10 lg:right-8 z-30">
          <div className="bg-[#8b6f47] text-white px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg shadow-lg">
            <span className="text-[10px] sm:text-xs md:text-sm font-medium tracking-wide">
              {t("home.newCollection")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

