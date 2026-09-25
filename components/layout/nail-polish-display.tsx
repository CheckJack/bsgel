"use client";

import { useLazyViewportVideo } from "@/lib/use-lazy-viewport-video";

const BACKGROUND_VIDEO = "/home-enzyme-scrub-preview.mp4";

export function NailPolishDisplay() {
  const { containerRef, videoRef, shouldLoad } = useLazyViewportVideo();

  return (
    <section
      ref={containerRef}
      className="relative h-[50vh] min-h-[280px] w-full overflow-hidden sm:h-[60vh] md:h-[70vh] lg:h-[85vh] xl:h-screen"
    >
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload="none"
        aria-hidden
        src={shouldLoad ? BACKGROUND_VIDEO : undefined}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </section>
  );
}
