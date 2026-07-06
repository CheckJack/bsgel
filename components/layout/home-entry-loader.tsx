"use client";

import { useEffect, useState } from "react";
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

export function HomeEntryLoader({
  onComplete,
  onExitStart,
  readyToExit = true,
  durationMs = 1800,
}: HomeEntryLoaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [minDurationPassed, setMinDurationPassed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setHomeLoaderChromeActive(true);
    document.documentElement.classList.add(HOME_ENTRY_LOADER_SCROLL_LOCK_CLASS);
    syncAppViewportHeight();

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

  if (!mounted) {
    return null;
  }

  return createPortal(
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
    </div>,
    document.body
  );
}
