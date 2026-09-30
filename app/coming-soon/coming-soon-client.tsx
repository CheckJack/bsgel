"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";
import { HeaderLanguageToggle } from "@/components/layout/header-nav-actions";

const BACKGROUND_VIDEO = "/coming-soon-background.mp4?v=2";
const LOGO_WHITE = "/bio-sculpture-white-hires-loader.png";

export function ComingSoonClient() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="fixed inset-0 z-0 h-[100dvh] min-h-[100svh] w-screen overflow-hidden bg-[#1a1a1a]">
      <video
        className="absolute inset-0 h-full w-full object-cover object-center"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      >
        <source src={BACKGROUND_VIDEO} type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden />

      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <Image
          src={LOGO_WHITE}
          alt={t("comingSoon.brand")}
          width={1200}
          height={200}
          sizes="(max-width: 640px) 145px, 170px"
          className="h-auto w-[145px] object-contain sm:w-[170px]"
          priority
          unoptimized
        />
      </div>

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <HeaderLanguageToggle
          language={language}
          onToggle={() => setLanguage(language === "en" ? "pt" : "en")}
          ariaLabel={
            language === "en" ? t("header.switchToPortuguese") : t("header.switchToEnglish")
          }
          title={t("header.currentLanguage", {
            language: language === "en" ? t("header.english") : t("header.portuguese"),
          })}
          className="!border-white/35 !bg-transparent !text-white hover:!bg-white/10 focus-visible:!ring-white/40"
        />
      </div>

      <main className="relative z-10 flex h-full min-h-[100svh] flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display max-w-xl text-balance text-4xl font-normal leading-tight text-white sm:text-5xl">
          {t("comingSoon.title")}
        </h1>
        <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-white/85 sm:text-lg">
          {t("comingSoon.body")}
        </p>
      </main>
    </div>
  );
}
