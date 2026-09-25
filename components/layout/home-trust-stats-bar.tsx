"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { useAppScrollInView, useMotionEnabled } from "@/lib/use-motion-enabled";

const STAT_KEYS = [
  "home.trustStat1",
  "home.trustStat2",
  "home.trustStat3",
  "home.trustStat4",
] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 1, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function TrustStatsGrid() {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-8 px-[5%] py-10 md:gap-y-10 md:py-12 lg:grid-cols-4 lg:gap-x-10">
      {STAT_KEYS.map((key) => {
        const stat = t(key);
        const [value, ...labelParts] = stat.split("|");
        const label = labelParts.join("|").trim();

        return (
          <div key={key} className="text-center">
            <p className="font-display text-3xl font-normal leading-none tracking-tight sm:text-4xl md:text-[2.75rem]">
              {value.trim()}
            </p>
            <p className="mt-3 font-header text-[11px] font-normal leading-snug tracking-[0.04em] text-brand-white/90 sm:text-xs md:mt-4">
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function HomeTrustStatsBar() {
  const { t } = useLanguage();
  const motionEnabled = useMotionEnabled();
  const viewport = useAppScrollInView({ amount: 0.2 });

  if (!motionEnabled) {
    return (
      <section
        className="w-full bg-pink-900 text-brand-white"
        aria-label={t("home.trustStatsAria")}
      >
        <TrustStatsGrid />
      </section>
    );
  }

  return (
    <motion.section
      className="w-full bg-pink-900 text-brand-white"
      aria-label={t("home.trustStatsAria")}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={containerVariants}
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 px-[5%] py-10 md:gap-y-10 md:py-12 lg:grid-cols-4 lg:gap-x-10">
        {STAT_KEYS.map((key) => {
          const stat = t(key);
          const [value, ...labelParts] = stat.split("|");
          const label = labelParts.join("|").trim();

          return (
            <motion.div key={key} className="text-center" variants={itemVariants}>
              <p className="font-display text-3xl font-normal leading-none tracking-tight sm:text-4xl md:text-[2.75rem]">
                {value.trim()}
              </p>
              <p className="mt-3 font-header text-[11px] font-normal leading-snug tracking-[0.04em] text-brand-white/90 sm:text-xs md:mt-4">
                {label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
