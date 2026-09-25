"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { useAppScrollInView, useMotionEnabled } from "@/lib/use-motion-enabled";

const TRAINING_IMAGE_MOBILE = "/home-training-banner-mobile.jpg";
const TRAINING_IMAGE_TABLET = "/home-training-banner-tablet.jpg";
const TRAINING_IMAGE_DESKTOP = "/home-training-banner-desktop.jpg";

const reveal = (
  motionEnabled: boolean,
  viewport: ReturnType<typeof useAppScrollInView>,
  x: number,
  delay = 0
) =>
  motionEnabled
    ? {
        initial: { opacity: 1, x },
        whileInView: { opacity: 1, x: 0 },
        viewport,
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const, delay },
      }
    : {};

function TrainingBannerImages({ alt }: { alt: string }) {
  const imageClass = "object-cover object-center";

  return (
    <>
      {/* Mobile &lt; 768px */}
      <Image
        src={TRAINING_IMAGE_MOBILE}
        alt={alt}
        fill
        className={`${imageClass} md:hidden`}
        sizes="100vw"
        unoptimized
      />
      {/* Tablet 768–1023px */}
      <Image
        src={TRAINING_IMAGE_TABLET}
        alt={alt}
        fill
        className={`${imageClass} hidden md:block lg:hidden`}
        sizes="100vw"
        unoptimized
      />
      {/* Desktop ≥ 1024px */}
      <Image
        src={TRAINING_IMAGE_DESKTOP}
        alt={alt}
        fill
        className={`${imageClass} hidden lg:block`}
        sizes="50vw"
        unoptimized
      />
    </>
  );
}

function TrainingBannerCopy() {
  const { t } = useLanguage();

  return (
    <>
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
    </>
  );
}

export function HomeKitJourneyBanner() {
  const { t } = useLanguage();
  const motionEnabled = useMotionEnabled();
  const viewport = useAppScrollInView({ amount: 0.2 });
  const imageAlt = t("home.trainingBannerImageAlt");

  const imageBlock = (
    <div className="relative min-h-[22rem] sm:min-h-[26rem] lg:min-h-[45rem]">
      <TrainingBannerImages alt={imageAlt} />
    </div>
  );

  const copyBlock = (
    <div className="flex flex-col justify-center px-6 py-10 sm:px-10 md:px-12 lg:px-14 lg:py-16 xl:px-20">
      <TrainingBannerCopy />
    </div>
  );

  if (!motionEnabled) {
    return (
      <section
        className="w-full bg-brand-white"
        aria-labelledby="home-training-banner-heading"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {imageBlock}
          {copyBlock}
        </div>
      </section>
    );
  }

  return (
    <section
      className="w-full bg-brand-white"
      aria-labelledby="home-training-banner-heading"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <motion.div
          className="relative min-h-[22rem] sm:min-h-[26rem] lg:min-h-[45rem]"
          {...reveal(motionEnabled, viewport, -40)}
        >
          <TrainingBannerImages alt={imageAlt} />
        </motion.div>

        <motion.div
          className="flex flex-col justify-center px-6 py-10 sm:px-10 md:px-12 lg:px-14 lg:py-16 xl:px-20"
          {...reveal(motionEnabled, viewport, 40, 0.08)}
        >
          <TrainingBannerCopy />
        </motion.div>
      </div>
    </section>
  );
}
