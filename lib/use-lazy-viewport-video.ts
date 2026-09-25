"use client";

import { useEffect, useRef, useState } from "react";
import {
  getAppScrollIntersectionRoot,
} from "@/lib/mobile-scroll-root";

type UseLazyViewportVideoOptions = {
  /** Prefetch shortly before the section enters the viewport. */
  rootMargin?: string;
  threshold?: number;
};

function parseRootMarginPx(rootMargin: string): number {
  const match = rootMargin.match(/^(-?\d+(?:\.\d+)?)px/);
  return match ? Number.parseFloat(match[1]) : 240;
}

function isElementVisibleInRoot(
  el: HTMLElement,
  root: Element | null,
  rootMarginPx = 240
): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;

  if (root) {
    const rootRect = root.getBoundingClientRect();
    return (
      rect.bottom > rootRect.top - rootMarginPx &&
      rect.top < rootRect.bottom + rootMarginPx &&
      rect.right > rootRect.left &&
      rect.left < rootRect.right
    );
  }

  return (
    rect.bottom > -rootMarginPx &&
    rect.top < window.innerHeight + rootMarginPx &&
    rect.right > 0 &&
    rect.left < window.innerWidth
  );
}

/**
 * Defers video download/playback until the container is near or in the viewport.
 * Uses `.app-scroll-root` as the IntersectionObserver root on mobile/tablet; falls
 * back to the browser viewport on desktop (`display: contents` on scroll root).
 */
export function useLazyViewportVideo(options: UseLazyViewportVideoOptions = {}) {
  const { rootMargin = "240px 0px", threshold = 0.01 } = options;
  const containerRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [inView, setInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const root = getAppScrollIntersectionRoot();
    const rootMarginPx = parseRootMarginPx(rootMargin);

    const syncVisibility = (intersecting: boolean) => {
      setInView(intersecting);
      if (intersecting) setHasLoaded(true);
    };

    const checkVisible = () => {
      if (isElementVisibleInRoot(el, root, rootMarginPx)) {
        syncVisibility(true);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => syncVisibility(entry.isIntersecting),
      { root, rootMargin, threshold }
    );

    observer.observe(el);
    checkVisible();
    const raf = requestAnimationFrame(checkVisible);

    const scrollTarget = root ?? window;
    scrollTarget.addEventListener("scroll", checkVisible, { passive: true });
    window.addEventListener("resize", checkVisible, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      scrollTarget.removeEventListener("scroll", checkVisible);
      window.removeEventListener("resize", checkVisible);
    };
  }, [rootMargin, threshold]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasLoaded) return;

    if (!inView) {
      video.pause();
      return;
    }

    video.preload = "auto";

    const play = () => {
      void video.play().catch(() => {});
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      play();
      return;
    }

    // preload="none" on the element defers fetch until load() is called.
    video.load();

    video.addEventListener("loadeddata", play, { once: true });
    video.addEventListener("canplay", play, { once: true });

    return () => {
      video.removeEventListener("loadeddata", play);
      video.removeEventListener("canplay", play);
    };
  }, [inView, hasLoaded]);

  return { containerRef, videoRef, shouldLoad: hasLoaded };
}
