"use client";

import Link from "next/link";
import Image from "next/image";
import trainingSessionImage from "../../sdbdsbdsbdsbdsbs1.png";
import trainingDetailImage from "../../3r3232r23.png";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

export function TrainingBanner() {
  const { t } = useLanguage();

  return (
    <section className="w-full bg-white px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
      <div className="container mx-auto max-w-[1920px]">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8 items-stretch">
          {/* Left Column - Image and Text Section */}
          <div className="flex flex-col">
            {/* Left Image */}
            <div className="relative mb-6 h-[280px] w-full overflow-hidden rounded-2xl bg-gray-100 sm:h-[360px] md:h-[420px] lg:h-[500px]">
              <div className="relative w-full h-full">
                <Image
                  src={trainingSessionImage}
                  alt="Training Session"
                  fill
                  className="!object-cover transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            
            {/* Text Section Below Left Image */}
            <div className="bg-white flex-1 flex flex-col justify-center">
              <h2 className="mb-4 text-3xl font-light tracking-tight text-brand-black sm:mb-6 sm:text-4xl lg:text-5xl">
                {t("home.trainWithUs")}
              </h2>
              <p className="mb-6 max-w-lg text-base font-light leading-relaxed text-gray-600 sm:mb-8 sm:text-lg">
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
          <div className="relative h-[360px] w-full overflow-hidden rounded-2xl bg-gray-100 sm:h-[500px] md:h-[600px] lg:h-[800px]">
            <div className="relative w-full h-full">
              <Image
                src={trainingDetailImage}
                alt="Training Detail"
                fill
                className="!object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
