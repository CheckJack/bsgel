"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  HOME_ENTRY_LOADER_SCROLL_LOCK_CLASS,
  setHomeLoaderChromeActive,
  syncAppViewportHeight,
} from "@/lib/home-entry-loader";

const EXIT_MS = 500;

interface HomeEntryLoaderProps {
  onComplete: () => void;
  onExitStart?: () => void;
  readyToExit?: boolean;
  durationMs?: number;
}

function LoaderOverlay({
  isExiting,
  showLogo,
}: {
  isExiting: boolean;
  showLogo: boolean;
}) {
  return (
    <div className="home-entry-loader-screen overflow-hidden" aria-hidden={isExiting}>
      <div
        className={cn(
          "loader-bg bg-[#857D71] transition-transform duration-500 ease-in-out",
          isExiting ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <Image
          src="/bio-sculpture-white-hires-loader.png"
          alt="Bio Sculpture"
          width={540}
          height={92}
          className={cn(
            "h-auto w-[min(68vw,240px)] sm:w-[300px] md:w-[360px]",
            showLogo && !isExiting && "transition-opacity duration-700 ease-out",
            showLogo || isExiting ? "opacity-100" : "opacity-0"
          )}
          priority
          unoptimized
        />
      </div>
    </div>
  );
}

export function HomeEntryLoader({
  onComplete,
  onExitStart,
  readyToExit = true,
  durationMs = 1800,
}: HomeEntryLoaderProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [minDurationPassed, setMinDurationPassed] = useState(false);

  // Before first paint: move overlay to body without a null frame (was the hydration flicker).
  useLayoutEffect(() => {
    setPortalTarget(document.body);
    setHomeLoaderChromeActive(true);
    document.documentElement.classList.add(HOME_ENTRY_LOADER_SCROLL_LOCK_CLASS);
    syncAppViewportHeight();
  }, []);

  useEffect(() => {
    const onViewportChange = () => syncAppViewportHeight();
    window.addEventListener("resize", onViewportChange);
    window.visualViewport?.addEventListener("resize", onViewportChange);
    window.visualViewport?.addEventListener("scroll", onViewportChange);

    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("scroll", onViewportChange);
    };
  }, []);

  useEffect(() => {
    const logoTimer = window.setTimeout(() => setShowLogo(true), 200);
    const minDurationTimer = window.setTimeout(() => setMinDurationPassed(true), durationMs);

    return () => {
      window.clearTimeout(logoTimer);
      window.clearTimeout(minDurationTimer);
    };
  }, [durationMs]);

  useEffect(() => {
    if (!minDurationPassed || !readyToExit || isExiting) return;
    setIsExiting(true);
  }, [isExiting, minDurationPassed, readyToExit]);

  useEffect(() => {
    if (!isExiting) return;
    onExitStart?.();
    const completeTimer = window.setTimeout(() => {
      onComplete();
    }, EXIT_MS);
    return () => window.clearTimeout(completeTimer);
  }, [isExiting, onComplete, onExitStart]);

  const overlay = <LoaderOverlay isExiting={isExiting} showLogo={showLogo} />;

  // SSR + first hydrate: in-tree taupe cover. After layout effect: portal to body.
  // Never return null — that caused the white background flash.
  if (portalTarget) {
    return createPortal(overlay, portalTarget);
  }

  return overlay;
}
