"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { useMotionEnabled } from "@/lib/use-motion-enabled";

const TRAINING_IMAGE = "/home-training-banner.png";

const reveal = (motionEnabled: boolean, x: number, delay = 0) =>
  motionEnabled
    ? {
        initial: { opacity: 0, x },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const, delay },
      }
    : {};

export function HomeKitJourneyBanner() {
  const { t } = useLanguage();
  const motionEnabled = useMotionEnabled();

  return (
    <section
      className="w-full bg-brand-white"
      aria-labelledby="home-training-banner-heading"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <motion.div
          className="relative min-h-[22rem] sm:min-h-[26rem] lg:min-h-[45rem]"
          {...reveal(motionEnabled, -40)}
        >
          <Image
            src={TRAINING_IMAGE}
            alt={t("home.trainingBannerImageAlt")}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1023px) 100vw, 50vw"
            unoptimized
          />
        </motion.div>

        <motion.div
          className="flex flex-col justify-center px-6 py-10 sm:px-10 md:px-12 lg:px-14 lg:py-16 xl:px-20"
          {...reveal(motionEnabled, 40, 0.08)}
        >
          <p className="font-header text-[11px] uppercase tracking-[0.16em] text-brand-black/55 sm:text-xs">
            {t("home.trainingBannerEyebrow")}
          </p>

          <h2
            id="home-training-banner-heading"
            className="mt-3 font-display text-[2rem] font-normal leading-[1.05] tracking-tight text-brand-black sm:mt-4 sm:text-4xl lg:text-[2.75rem] xl:text-5xl"
          >
            {t("home.trainingBannerTitle")}
          </h2>

          <p className="mt-6 font-header text-sm leading-relaxed text-brand-black/70 sm:mt-7 sm:text-base lg:mt-8">
            {t("home.trainingBannerDesc")}
          </p>

          <div className="mt-8 lg:mt-10">
            <Link
              href="/training"
              className="font-header inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-full bg-brand-black px-8 text-sm uppercase tracking-[0.14em] text-brand-white transition-colors hover:bg-brand-champagne-dark sm:min-h-[3.25rem] sm:text-[13px]"
            >
              {t("home.trainingBannerCta")}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
