"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { PressLogoMarquee } from "@/components/layout/press-logo-marquee";
import { cn } from "@/lib/utils";

const HERO_IMAGE = "/home-main-hero-v28.png";
const HERO_BADGE_IMAGE = "/home-hero-badge.svg";

const EASE = [0.22, 1, 0.36, 1] as const;

const copyContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0 },
  },
};

const copyItemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE },
  },
};

export function HomeMainHero({
  onImageReady,
  entryRevealed = true,
}: {
  onImageReady?: () => void;
  entryRevealed?: boolean;
}) {
  const { t } = useLanguage();
  const motionEnabled = useMotionEnabled();
  const [imageLoaded, setImageLoaded] = useState(false);
  const animateIn = entryRevealed && motionEnabled;

  useEffect(() => {
    if (imageLoaded) onImageReady?.();
  }, [imageLoaded, onImageReady]);

  return (
    <section
      aria-labelledby="home-main-hero-heading"
      className={cn(
        "flex w-full flex-col bg-brand-white",
        "lg:h-[calc(97dvh-var(--site-header-height,113px))] lg:overflow-visible"
      )}
    >
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:grid lg:grid-cols-2">
        <div className="relative order-1 h-[min(46svh,420px)] min-h-[240px] flex-none overflow-hidden [transform:translateZ(0)] lg:order-2 lg:h-full lg:min-h-0 lg:max-h-none">
          <motion.div
            className="pointer-events-none absolute right-4 top-4 z-10 sm:right-6 sm:top-6 lg:right-8 lg:top-8"
            initial={motionEnabled ? { opacity: 0, scale: 0.96 } : false}
            animate={
              animateIn
                ? { opacity: 1, scale: 1 }
                : motionEnabled
                  ? { opacity: 0, scale: 0.96 }
                  : { opacity: 1, scale: 1 }
            }
            transition={{ duration: 0.35, ease: EASE, delay: 0.06 }}
          >
            <Image
              src={HERO_BADGE_IMAGE}
              alt={t("home.mainHeroBadgeAlt")}
              width={450}
              height={459}
              className="h-auto w-[5.75rem] md:w-28 lg:w-36 xl:w-40"
              unoptimized
            />
          </motion.div>
          <Image
            src={HERO_IMAGE}
            alt={t("home.mainHeroImageAlt")}
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 50vw"
            className={cn(
              "object-cover object-center",
              motionEnabled && "transition-opacity duration-500",
              imageLoaded ? "opacity-100" : motionEnabled ? "opacity-0" : "opacity-100"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded ? (
            <div className="absolute inset-0 bg-[#f3ece8]" aria-hidden />
          ) : null}
        </div>

        <div className="order-2 flex shrink-0 flex-col items-center justify-center px-6 py-6 max-lg:px-6 max-lg:pt-11 max-lg:pb-11 sm:px-10 md:px-12 lg:order-1 lg:shrink lg:flex-none lg:px-14 lg:py-14 xl:px-20 xl:py-14">
          <motion.div
            className="mx-auto w-full max-w-xl translate-x-0 text-center sm:max-w-2xl lg:max-w-2xl lg:translate-x-10 lg:px-2 lg:text-left xl:translate-x-12"
            initial={motionEnabled ? "hidden" : false}
            animate={animateIn ? "visible" : motionEnabled ? "hidden" : "visible"}
            variants={motionEnabled ? copyContainerVariants : { hidden: {}, visible: {} }}
          >
            <motion.div
              className="mb-4 flex items-center justify-center gap-2 sm:mb-5 lg:justify-start"
              variants={motionEnabled ? copyItemVariants : undefined}
            >
              <div className="flex items-center gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="size-3 fill-pink-500 text-pink-500 sm:size-3.5"
                  />
                ))}
              </div>
              <p className="font-header text-[10px] uppercase tracking-[0.16em] text-brand-black/55 sm:text-[11px]">
                <span className="lg:hidden">{t("home.mainHeroEyebrowMobile")}</span>
                <span className="hidden lg:inline">{t("home.mainHeroEyebrow")}</span>
              </p>
            </motion.div>

            <motion.h1
              id="home-main-hero-heading"
              className="font-display text-[2.6rem] font-normal leading-[1.02] tracking-tight text-brand-black sm:text-[3.15rem] lg:text-left lg:text-[3.75rem] xl:text-[4.25rem]"
              variants={motionEnabled ? copyItemVariants : undefined}
            >
              {t("home.mainHeroTitleLine1")}
              <span className="block">{t("home.mainHeroTitleLine2")}</span>
            </motion.h1>

            <motion.div
              className="mx-auto mt-7 inline-flex w-full max-w-md flex-col items-center sm:mt-8 lg:mx-0 lg:w-fit lg:items-start"
              variants={motionEnabled ? copyItemVariants : undefined}
            >
              <Link
                href="/colours#products"
                className="font-header inline-flex min-h-12 w-full max-w-md items-center justify-center rounded-full bg-brand-black px-8 text-center text-sm uppercase tracking-[0.14em] text-brand-white transition-colors hover:bg-brand-champagne-dark sm:min-h-[3.25rem] sm:w-fit sm:max-w-none sm:px-16 sm:text-[13px]"
              >
                {t("home.mainHeroCta")}
              </Link>

              <p className="mt-4 text-center font-header text-xs text-brand-black/50 sm:text-sm">
                {t("home.mainHeroSubtext")}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="shrink-0 lg:relative lg:z-10"
        initial={motionEnabled ? { opacity: 0, y: 16 } : false}
        animate={
          animateIn
            ? { opacity: 1, y: 0 }
            : motionEnabled
              ? { opacity: 0, y: 16 }
              : { opacity: 1, y: 0 }
        }
        transition={{ duration: motionEnabled ? 0.4 : 0, ease: EASE, delay: motionEnabled ? 0.08 : 0 }}
      >
        <PressLogoMarquee />
      </motion.div>
    </section>
  );
}
