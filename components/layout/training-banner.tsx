"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

export function TrainingBanner() {
  const { t } = useLanguage();

  return (
    <section className="w-full py-16 sm:py-20 px-4 sm:px-6 bg-white">
      <div className="container mx-auto max-w-[1920px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-stretch">
          {/* Left Column - Image and Text Section */}
          <div className="flex flex-col">
            {/* Left Image */}
            <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] overflow-hidden rounded-2xl mb-6">
              <div className="relative w-full h-full">
                <Image
                  src="/Training_1.webp"
                  alt="Training Session"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            
            {/* Text Section Below Left Image */}
            <div className="bg-white flex-1 flex flex-col justify-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-4 sm:mb-6 text-brand-black">
                {t("home.trainWithUs")}
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 font-light leading-relaxed max-w-lg">
                {t("home.trainWithUsDesc")}
              </p>
              <Link href="/training">
                <Button className="bg-brand-black text-brand-white hover:bg-brand-black/90 px-6 sm:px-8 py-3 text-sm sm:text-base w-full sm:w-auto font-light transition-all duration-300 hover:shadow-lg">
                  {t("home.shopCoursesKits")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column - Vertical Image */}
          <div className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden rounded-2xl">
            <div className="relative w-full h-full">
              <Image
                src="/DSC_8219-v3.webp"
                alt="Training Detail"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
