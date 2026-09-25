"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DESKTOP_MQ = "(min-width: 768px)";

/**
 * Autoplay hero video for md+ viewports only. Skips mounting on mobile so
 * hidden heroes never download with preload="auto".
 */
export function DesktopHeroVideo({
  src,
  ariaLabel,
  className,
}: {
  src: string;
  ariaLabel: string;
  className?: string;
}) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!isDesktop) return null;

  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-label={ariaLabel}
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
