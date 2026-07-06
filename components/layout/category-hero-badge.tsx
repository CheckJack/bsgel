"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

const HOME_HERO_BADGE_IMAGE = "/home-hero-badge.svg";
const GEMINI_HERO_BADGE_IMAGE = "/gemini-hero-badge.png";

const BADGE_SIZE_HOME = "h-auto w-20 sm:w-28 md:w-32 lg:w-36 xl:w-40";
const BADGE_SIZE_GEMINI = "h-auto w-20 sm:w-24 md:w-28 lg:w-36 xl:w-40";

type CategoryHeroBadgeProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

function CategoryHeroBadgeImage({
  src,
  alt,
  width,
  height,
  className,
}: CategoryHeroBadgeProps) {
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10 sm:right-6 sm:top-6 md:right-8 md:top-8">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(className)}
        unoptimized
      />
    </div>
  );
}

export function CategoryHeroBadge() {
  const { t } = useLanguage();

  return (
    <CategoryHeroBadgeImage
      src={HOME_HERO_BADGE_IMAGE}
      alt={t("home.mainHeroBadgeAlt")}
      width={450}
      height={459}
      className={BADGE_SIZE_HOME}
    />
  );
}

export function GeminiHeroBadge() {
  const { t } = useLanguage();

  return (
    <CategoryHeroBadgeImage
      src={GEMINI_HERO_BADGE_IMAGE}
      alt={t("productPages.gemini.heroBadgeAlt")}
      width={1920}
      height={1920}
      className={BADGE_SIZE_GEMINI}
    />
  );
}
