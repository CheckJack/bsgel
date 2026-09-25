"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { HomeMainHero } from "@/components/layout/home-main-hero";
import { FeaturedProducts } from "@/components/layout/featured-products";
import { HomeTrustStatsBar } from "@/components/layout/home-trust-stats-bar";
import { HomeKitJourneyBanner } from "@/components/layout/home-kit-journey-banner";
import { FeaturedSpaProducts } from "@/components/layout/featured-spa-products";
import { FeaturedBasesProducts } from "@/components/layout/featured-bases-products";
import { HomeColourPolishBanner } from "@/components/layout/home-colour-polish-banner";
import { FeaturedIntempuralProducts } from "@/components/layout/featured-intempural-products";
import { HomeEnzymeScrubBanner } from "@/components/layout/home-enzyme-scrub-banner";
import { NailPolishDisplay } from "@/components/layout/nail-polish-display";
import { HomeEntryLoader } from "@/components/layout/home-entry-loader";
import {
  HOME_ENTRY_LOADER_SCROLL_LOCK_CLASS,
  notifyHomeEntryLoaderComplete,
  releaseHomeScrollLock,
  setHomeLoaderChromeActive,
  syncAppViewportHeight,
} from "@/lib/home-entry-loader";
import { scrollAppScrollRootToTop } from "@/lib/mobile-scroll-root";
import { HomepageProductsProvider } from "@/contexts/homepage-products-context";

export default function Home() {
  const [showEntryLoader, setShowEntryLoader] = useState(true);
  const [heroReady, setHeroReady] = useState(false);

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    setHomeLoaderChromeActive(true);
    syncAppViewportHeight();
    scrollAppScrollRootToTop();
  }, []);

  useEffect(() => {
    const heroFallback = window.setTimeout(() => setHeroReady(true), 2500);
    const loaderFallback = window.setTimeout(() => {
      setShowEntryLoader(false);
      notifyHomeEntryLoaderComplete();
    }, 4000);
    return () => {
      window.clearTimeout(heroFallback);
      window.clearTimeout(loaderFallback);
    };
  }, []);

  useEffect(() => {
    if (showEntryLoader) {
      document.documentElement.classList.add(HOME_ENTRY_LOADER_SCROLL_LOCK_CLASS);
    } else {
      releaseHomeScrollLock();
    }
    return () => releaseHomeScrollLock();
  }, [showEntryLoader]);

  useEffect(() => {
    return () => releaseHomeScrollLock();
  }, []);

  const handleLoaderComplete = useCallback(() => {
    setShowEntryLoader(false);
    notifyHomeEntryLoaderComplete();
    scrollAppScrollRootToTop();
  }, []);

  useEffect(() => {
    if (!showEntryLoader) {
      scrollAppScrollRootToTop();
    }
  }, [showEntryLoader]);

  return (
    <>
      {showEntryLoader && (
        <HomeEntryLoader
          onComplete={handleLoaderComplete}
          onExitStart={handleLoaderComplete}
          readyToExit={heroReady}
        />
      )}
      {/* No ScrollReveal wrappers — content must always paint on mobile */}
      <HomepageProductsProvider>
        <HomeMainHero onImageReady={() => setHeroReady(true)} entryRevealed />
        <FeaturedProducts />
        <HomeTrustStatsBar />
        <HomeKitJourneyBanner />
        <FeaturedSpaProducts />
        <HomeEnzymeScrubBanner />
        <FeaturedBasesProducts />
        <HomeColourPolishBanner />
        <FeaturedIntempuralProducts />
      </HomepageProductsProvider>
      <NailPolishDisplay />
    </>
  );
}
