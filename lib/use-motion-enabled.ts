"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

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

/** False on mobile and when the user prefers reduced motion. */
export function useMotionEnabled() {
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  return !reduceMotion && !isMobile;
}

export function isMobileViewport(breakpoint = MOBILE_MAX_WIDTH_PX) {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
}
