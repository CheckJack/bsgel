"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { useLazyViewportVideo } from "@/lib/use-lazy-viewport-video";

const BACKGROUND_VIDEO = "/home-colour-polish-banner.mp4";
const LEARN_MORE_HREF = "/gemini";

export function HomeColourPolishBanner() {
  const { t } = useLanguage();
  const { containerRef, videoRef, shouldLoad } = useLazyViewportVideo();

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-[#e8e8e8]"
      aria-labelledby="home-colour-polish-heading"
    >
      <div className="relative w-full h-[min(540px,74svh)] sm:h-[min(580px,76svh)] md:h-[min(620px,78svh)] lg:h-auto lg:aspect-[2.3/1] overflow-hidden">
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          preload="none"
          aria-hidden
          src={shouldLoad ? BACKGROUND_VIDEO : undefined}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-black/10 lg:bg-gradient-to-r lg:from-black/45 lg:via-black/20 lg:to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center px-5 sm:px-6 lg:justify-start lg:px-16">
        <div className="max-w-[88%] text-center sm:max-w-[92%] lg:max-w-2xl lg:text-left">
          <h2
            id="home-colour-polish-heading"
            className="font-display text-balance font-normal leading-[1.08] tracking-tight text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)] text-[clamp(1.85rem,8cqw,2.75rem)] sm:text-[clamp(2.05rem,8.5cqw,3rem)] md:text-[clamp(2.2rem,9cqw,3.25rem)] lg:text-[3.75rem] lg:leading-[1.12] lg:drop-shadow-none"
          >
            <span className="block">{t("home.colourPolishBannerHeadlineLine1")}</span>
            <span className="block">{t("home.colourPolishBannerHeadlineLine2")}</span>
          </h2>
          <Link
            href={LEARN_MORE_HREF}
            className="font-header mt-6 hidden min-h-[3.25rem] w-fit items-center justify-center rounded-full border border-white bg-transparent px-16 text-[13px] uppercase tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-brand-black sm:mt-8 lg:inline-flex"
          >
            {t("home.colourPolishBannerCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
