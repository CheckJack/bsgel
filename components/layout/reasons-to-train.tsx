"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Award, Tag, Heart, RefreshCw, TrendingUp, ShoppingBag } from "lucide-react";
import { ReactNode } from "react";

interface ReasonItem {
  icon: ReactNode;
  text: string;
}

export function ReasonsToTrain() {
  const leftColumnItems: ReasonItem[] = [
    {
      icon: <Award className="w-6 h-6" strokeWidth={2} stroke="currentColor" fill="none" />,
      text: "Award Winning Training",
    },
    {
      icon: <Tag className="w-6 h-6" strokeWidth={2} stroke="currentColor" fill="none" />,
      text: "Industry-Leading Brands",
    },
    {
      icon: <Heart className="w-6 h-6" strokeWidth={2} stroke="currentColor" fill="none" />,
      text: "Health-Led, Prescriptive Approach",
    },
  ];

  const rightColumnItems: ReasonItem[] = [
    {
      icon: <RefreshCw className="w-6 h-6" strokeWidth={2} stroke="currentColor" fill="none" />,
      text: "Lifetime Training Guarantee",
    },
    {
      icon: <TrendingUp className="w-6 h-6" strokeWidth={2} stroke="currentColor" fill="none" />,
      text: "Salon Listing & Business Support",
    },
    {
      icon: <ShoppingBag className="w-6 h-6" strokeWidth={2} stroke="currentColor" fill="none" />,
      text: "Money Back & Exclusive Discounts",
    },
  ];

  return (
    <section className="w-full mt-2 bg-gray-50 py-8 sm:py-12 md:py-16">
      <div className="w-full">
        {/* Three Containers Side by Side - Horizontally Aligned */}
        <div className="flex flex-col md:flex-row items-start gap-0 mb-8 md:mb-10 relative">
          {/* Container 1: Title - Left Side - Matching Training Banner padding */}
          <div className="flex-shrink-0 pl-4 sm:pl-6 md:pl-8 pr-4 sm:pr-8 md:pr-12 mb-6 md:mb-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black text-left uppercase tracking-wide">
              REASONS TO TRAIN
            </h2>
          </div>

          {/* Container 2: Left Column Items - Middle */}
          <div className="flex-1 space-y-0 px-4 sm:px-8 md:px-12 w-full md:w-auto">
            {leftColumnItems.map((item, index) => (
              <div key={index}>
                <div className="flex items-center py-3 sm:py-4 md:py-6">
                  <div className="mr-3 sm:mr-4 flex-shrink-0 text-black stroke-black w-5 h-5 sm:w-6 sm:h-6">{item.icon}</div>
                  <span className="text-sm sm:text-base md:text-lg text-black font-medium">
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
                <Button className="bg-black text-white hover:bg-black/90 uppercase tracking-wide px-6 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base rounded-none w-full sm:w-auto">
                  DISCOVER NOW
                </Button>
              </Link>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden md:block w-px bg-gray-300 self-stretch"></div>

          {/* Container 3: Right Column Items - Right Side */}
          <div className="flex-1 space-y-0 px-4 sm:px-8 md:pl-12 w-full md:w-auto mt-6 md:mt-0">
            {rightColumnItems.map((item, index) => (
              <div key={index}>
                <div className="flex items-center py-3 sm:py-4 md:py-6">
                  <div className="mr-3 sm:mr-4 flex-shrink-0 text-black stroke-black w-5 h-5 sm:w-6 sm:h-6">{item.icon}</div>
                  <span className="text-sm sm:text-base md:text-lg text-black font-medium">
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
