"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

const BACKGROUND_IMAGE = "/home-deep-edit-background.jpg";
const LOGO_IMAGE = "/home-deep-edit-logo.png";
const SHOP_HREF = "/products";

export function HomeExperienceBanner() {
  const { t } = useLanguage();

  return (
    <section
      className="relative w-full min-h-[calc(100lvh-var(--site-header-height,113px))] h-[calc(100dvh-var(--site-header-height,113px))] overflow-hidden"
      aria-labelledby="home-deep-edit-banner-heading"
    >
      <Image
        src={BACKGROUND_IMAGE}
        alt={t("home.deepEditBannerImageAlt")}
        fill
        priority={false}
        sizes="100vw"
        className="object-cover object-center"
        unoptimized
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-transparent" />

      <div className="relative z-10 flex h-full items-center px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <div className="flex max-w-[min(100%,18rem)] flex-col items-start gap-5 sm:max-w-xs sm:gap-6 md:max-w-sm md:gap-7 lg:max-w-md">
          <h2 id="home-deep-edit-banner-heading" className="sr-only">
            {t("home.deepEditBannerLogoAlt")}
          </h2>

          <Image
            src={LOGO_IMAGE}
            alt={t("home.deepEditBannerLogoAlt")}
            width={320}
            height={120}
            className="h-auto w-full max-w-[11rem] sm:max-w-[13rem] md:max-w-[15rem] lg:max-w-[17rem]"
            unoptimized
          />

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
