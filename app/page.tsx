"use client";

import { useCallback, useState } from "react";
import { HeroSlider } from "@/components/layout/hero-slider";
import { ShopCategoriesStrip } from "@/components/layout/shop-categories-strip";
import { TrainingBanner } from "@/components/layout/training-banner";
import { ReasonsToTrain } from "@/components/layout/reasons-to-train";
import { FeaturedProducts } from "@/components/layout/featured-products";
import { AsSeenIn } from "@/components/layout/as-seen-in";
import { NailPolishDisplay } from "@/components/layout/nail-polish-display";
import { HomeEntryLoader } from "@/components/layout/home-entry-loader";

export default function Home() {
  const [showEntryLoader, setShowEntryLoader] = useState(true);
  const handleLoaderComplete = useCallback(() => {
    setShowEntryLoader(false);
  }, []);

  const slides = [
    {
      type: "image" as const,
      src: "/hero-experience-evolution-6.svg",
    },
    {
      type: "image" as const,
      src: "/hero-experience-evolution-7.svg",
    },
    {
      type: "image" as const,
      src: "/hero-experience-evolution-9.svg",
    },
    {
      type: "image" as const,
      src: "/hero-experience-evolution-17.svg",
    },
  ];

  return (
    <>
      {showEntryLoader && <HomeEntryLoader onComplete={handleLoaderComplete} />}
      <HeroSlider
        slides={slides}
        autoPlayInterval={5000}
        className="h-[calc(100vh-var(--site-header-height,113px))]"
        showDarkOverlay={false}
      />
      <ShopCategoriesStrip />
      <FeaturedProducts />
      <TrainingBanner />
      <ReasonsToTrain />
      <AsSeenIn />
      <NailPolishDisplay />
    </>
  );
}

