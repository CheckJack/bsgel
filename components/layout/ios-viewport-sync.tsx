"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { syncIosViewportHeight } from "@/lib/mobile-scroll-root";

function syncVisualViewportOffset() {
  const vv = window.visualViewport;
  if (!vv) return;
  document.documentElement.style.setProperty(
    "--visual-viewport-offset-top",
    `${Math.max(0, Math.round(vv.offsetTop))}px`
  );
}

/** Keeps --ios-viewport-height in sync when Safari shows/hides the URL bar. */
export function IosViewportSync() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (!window.matchMedia("(max-width: 1023px)").matches) return;

    const vv = window.visualViewport;
    if (!vv) return;

    syncVisualViewportOffset();
    vv.addEventListener("resize", syncVisualViewportOffset, { passive: true });
    vv.addEventListener("scroll", syncVisualViewportOffset, { passive: true });

    return () => {
      vv.removeEventListener("resize", syncVisualViewportOffset);
      vv.removeEventListener("scroll", syncVisualViewportOffset);
      document.documentElement.style.removeProperty("--visual-viewport-offset-top");
    };
  }, []);

  useEffect(() => {
    if (isAuthPage) return;

    syncIosViewportHeight();

    const onChange = () => syncIosViewportHeight();
    window.addEventListener("resize", onChange, { passive: true });
    window.visualViewport?.addEventListener("resize", onChange, { passive: true });
    window.visualViewport?.addEventListener("scroll", onChange, { passive: true });

    return () => {
      window.removeEventListener("resize", onChange);
      window.visualViewport?.removeEventListener("resize", onChange);
      window.visualViewport?.removeEventListener("scroll", onChange);
    };
  }, [isAuthPage]);

  return null;
}
