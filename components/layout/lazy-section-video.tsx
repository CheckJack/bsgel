"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLazyViewportVideo } from "@/lib/use-lazy-viewport-video";

/**
 * Below-the-fold section video — defers fetch until near the viewport.
 */
export function LazySectionVideo({
  src,
  className,
  overlay,
}: {
  src: string;
  className?: string;
  overlay?: ReactNode;
}) {
  const { containerRef, videoRef, shouldLoad } = useLazyViewportVideo();

  return (
    <section
      ref={containerRef}
      className={cn("relative w-full h-[60vh] md:h-[70vh] overflow-hidden", className)}
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        className="absolute inset-0 h-full w-full object-cover"
        src={shouldLoad ? src : undefined}
      />
      {overlay}
    </section>
  );
}
