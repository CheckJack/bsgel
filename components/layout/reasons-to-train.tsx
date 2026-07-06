"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Award, Tag, Heart, RefreshCw, TrendingUp, Beaker } from "lucide-react";
import { ReactNode } from "react";
import { useLanguage } from "@/contexts/language-context";

interface ReasonItem {
  icon: ReactNode;
  text: string;
}

export function ReasonsToTrain() {
  const { t } = useLanguage();

  const leftColumnItems: ReasonItem[] = [
    {
      icon: <Award className="w-6 h-6" strokeWidth={2} stroke="currentColor" fill="none" />,
      text: t("home.awardWinningTraining"),
    },
    {
      icon: <Tag className="w-6 h-6" strokeWidth={2} stroke="currentColor" fill="none" />,
      text: t("home.industryLeadingBrands"),
    },
    {
      icon: <Heart className="w-6 h-6" strokeWidth={2} stroke="currentColor" fill="none" />,
      text: t("home.healthLedPrescriptive"),
    },
  ];

  const rightColumnItems: ReasonItem[] = [
    {
      icon: <RefreshCw className="w-6 h-6" strokeWidth={2} stroke="currentColor" fill="none" />,
      text: t("home.lifetimeTrainingGuarantee"),
    },
    {
      icon: <TrendingUp className="w-6 h-6" strokeWidth={2} stroke="currentColor" fill="none" />,
      text: t("home.salonListingBusinessSupport"),
    },
    {
      icon: <Beaker className="w-6 h-6" strokeWidth={2} stroke="currentColor" fill="none" />,
      text: t("home.moneyBackExclusiveDiscounts"),
    },
  ];

  return (
    <section className="w-full mt-2 bg-gray-50 py-8 sm:py-10 md:py-12 lg:py-16">
      <div className="container mx-auto max-w-[1920px] px-4 sm:px-6">
        {/* Three Containers Side by Side - Horizontally Aligned */}
        <div className="mb-8 relative grid grid-cols-1 gap-6 lg:mb-10 lg:grid-cols-[minmax(220px,0.9fr)_1fr_1fr] lg:items-start lg:gap-0">
          {/* Container 1: Title - Left Side - Matching Training Banner padding */}
          <div className="pr-0 mb-2 lg:pr-12 lg:mb-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-brand-black text-left tracking-tight">
              {t("home.reasonsToTrain")}
            </h2>
          </div>

          {/* Container 2: Left Column Items - Middle */}
          <div className="w-full space-y-0 pr-0 lg:pr-12">
            {leftColumnItems.map((item, index) => (
              <div key={index}>
                <div className="flex items-center py-3 sm:py-4 md:py-6">
                  <div className="mr-3 sm:mr-4 flex-shrink-0 text-brand-black stroke-brand-black w-5 h-5 sm:w-6 sm:h-6">{item.icon}</div>
                  <span className="text-sm sm:text-base md:text-lg text-brand-black font-light">
                    {item.text}
                  </span>
                </div>
                {index < leftColumnItems.length - 1 && (
                  <div className="border-t border-gray-300"></div>
                )}
              </div>
            ))}
            {/* Call to Action Button - Below Left Column */}
            <div className="flex justify-start mt-6 sm:mt-8">
              <Link href="/training">
                <Button className="bg-brand-black text-brand-white hover:bg-brand-black/90 px-6 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base w-full sm:w-auto font-light">
                  {t("home.discoverNow")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Container 3: Right Column Items - Right Side */}
          <div className="w-full space-y-0 pl-0 mt-2 lg:pl-12 lg:mt-0 lg:border-l lg:border-gray-300">
            {rightColumnItems.map((item, index) => (
              <div key={index}>
                <div className="flex items-center py-3 sm:py-4 md:py-6">
                  <div className="mr-3 sm:mr-4 flex-shrink-0 text-brand-black stroke-brand-black w-5 h-5 sm:w-6 sm:h-6">{item.icon}</div>
                  <span className="text-sm sm:text-base md:text-lg text-brand-black font-light">
                    {item.text}
                  </span>
                </div>
                {index < rightColumnItems.length - 1 && (
                  <div className="border-t border-gray-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
