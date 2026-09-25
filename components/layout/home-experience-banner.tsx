"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

const BACKGROUND_IMAGE = "/home-deep-edit-background.jpg";
const BACKGROUND_VIDEO = "/home-deep-edit-background-v2.mp4";
const SHOP_HREF = "/products";

export function HomeExperienceBanner() {
  const { t } = useLanguage();

  return (
    <section
      className="relative w-full min-h-[calc(100lvh-var(--site-header-height,113px))] h-[calc(100dvh-var(--site-header-height,113px))] overflow-hidden"
      aria-labelledby="home-deep-edit-banner-heading"
    >
      {/* Poster / fallback while video loads */}
      <Image
        src={BACKGROUND_IMAGE}
        alt=""
        fill
        priority={false}
        sizes="100vw"
        className="object-cover object-center"
        unoptimized
        aria-hidden
      />

      <video
        key={BACKGROUND_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={BACKGROUND_IMAGE}
        aria-label={t("home.deepEditBannerImageAlt")}
        className="absolute inset-0 h-full w-full object-cover object-center"
      >
        <source src={BACKGROUND_VIDEO} type="video/mp4" />
      </video>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-transparent" />

      <div className="relative z-10 flex h-full items-center px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <div className="flex max-w-[min(100%,18rem)] flex-col items-start sm:max-w-xs md:max-w-sm lg:max-w-md">
          <h2 id="home-deep-edit-banner-heading" className="sr-only">
            {t("home.deepEditBannerLogoAlt")}
          </h2>

          <Link
            href={SHOP_HREF}
            className="font-header inline-flex min-h-11 w-full max-w-[13rem] items-center justify-center rounded-full bg-brand-black px-8 text-center text-xs uppercase tracking-[0.14em] text-brand-white transition-colors hover:bg-brand-champagne-dark sm:min-h-12 sm:max-w-[14rem] sm:text-sm"
          >
            {t("home.deepEditBannerCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
