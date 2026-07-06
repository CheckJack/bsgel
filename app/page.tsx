"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { HomeMainHero } from "@/components/layout/home-main-hero";
import { FeaturedProducts } from "@/components/layout/featured-products";
import { HomeTrustStatsBar } from "@/components/layout/home-trust-stats-bar";
import { HomeKitJourneyBanner } from "@/components/layout/home-kit-journey-banner";
import { FeaturedSpaProducts } from "@/components/layout/featured-spa-products";
import { FeaturedBasesProducts } from "@/components/layout/featured-bases-products";
import { HomeExperienceBanner } from "@/components/layout/home-experience-banner";
import { NailPolishDisplay } from "@/components/layout/nail-polish-display";
import { HomeEntryLoader } from "@/components/layout/home-entry-loader";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import {
  HOME_ENTRY_LOADER_SCROLL_LOCK_CLASS,
  notifyHomeEntryLoaderComplete,
  releaseHomeScrollLock,
  setHomeLoaderChromeActive,
  syncAppViewportHeight,
} from "@/lib/home-entry-loader";
import { scrollAppScrollRootToTop } from "@/lib/mobile-scroll-root";

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [showEntryLoader, setShowEntryLoader] = useState(true);
  const [heroReady, setHeroReady] = useState(false);
  const [heroEntryRevealed, setHeroEntryRevealed] = useState(false);

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    setHomeLoaderChromeActive(true);
    syncAppViewportHeight();
    scrollAppScrollRootToTop();
  }, []);

  useEffect(() => {
    setHydrated(true);

    const heroFallback = window.setTimeout(() => setHeroReady(true), 4000);
    const loaderFallback = window.setTimeout(() => {
      setShowEntryLoader(false);
      setHeroEntryRevealed(true);
      notifyHomeEntryLoaderComplete();
    }, 6000);
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

  // Safety: never leave the homepage with scroll locked (e.g. loader timer bug / fast navigation)
  useEffect(() => {
    return () => releaseHomeScrollLock();
  }, []);

  const handleLoaderExitStart = useCallback(() => {
    setHeroEntryRevealed(true);
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

  if (!hydrated) {
    return (
      <div className="home-entry-loader-screen overflow-hidden" aria-hidden>
        <div className="loader-bg bg-[#857D71]" />
      </div>
    );
  }

  return (
    <>
      {showEntryLoader && (
        <HomeEntryLoader
          onComplete={handleLoaderComplete}
          onExitStart={handleLoaderExitStart}
          readyToExit={heroReady}
        />
      )}
      <HomeMainHero
        onImageReady={() => setHeroReady(true)}
        entryRevealed={heroEntryRevealed}
      />
      <ScrollReveal>
        <FeaturedProducts />
      </ScrollReveal>
      <HomeTrustStatsBar />
      <HomeKitJourneyBanner />
      <ScrollReveal>
        <FeaturedSpaProducts />
      </ScrollReveal>
      <ScrollReveal direction="fade">
        <HomeExperienceBanner />
      </ScrollReveal>
      <ScrollReveal>
        <FeaturedBasesProducts />
      </ScrollReveal>
      <ScrollReveal direction="fade">
        <NailPolishDisplay />
      </ScrollReveal>
    </>
  );
}
