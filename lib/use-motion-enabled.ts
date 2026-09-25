"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { APP_SCROLL_ROOT_SELECTOR } from "@/lib/mobile-scroll-root";

export const MOBILE_MAX_WIDTH_PX = 1023;

export function useIsMobile(breakpoint = MOBILE_MAX_WIDTH_PX) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}

/** False until mounted, on mobile, or when the user prefers reduced motion. */
export function useMotionEnabled() {
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return false;
  return !reduceMotion && !isMobile;
}

export function isMobileViewport(breakpoint = MOBILE_MAX_WIDTH_PX) {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
}

/** Viewport for whileInView when the page scrolls inside .app-scroll-root (mobile shell). */
export function useAppScrollInView(options?: { once?: boolean; amount?: number }) {
  const rootRef = useRef<Element | null>(null);

  useEffect(() => {
    rootRef.current = document.querySelector(APP_SCROLL_ROOT_SELECTOR);
  }, []);

  return {
    once: options?.once ?? true,
    amount: options?.amount ?? 0.15,
    root: rootRef,
  };
}
