"use client";

import { useLanguage } from "@/contexts/language-context";

type NewsSiteHeaderProps = {
  tickerTitles?: string[];
};

export function NewsSiteHeader({ tickerTitles = [] }: NewsSiteHeaderProps) {
  const { t } = useLanguage();

  if (tickerTitles.length === 0) return null;

  return (
    <div className="bg-pink-900 text-white">
      <div className="container mx-auto flex max-w-7xl items-stretch gap-0 px-0 sm:px-6">
        <div className="flex shrink-0 items-center bg-pink-950 px-4 py-2.5 font-header text-[10px] font-semibold uppercase tracking-[0.18em]">
          {t("bioNews.breaking")}
        </div>
        <div className="scrollbar-hide flex flex-1 items-center gap-8 overflow-x-auto px-4 py-2.5">
          {tickerTitles.map((title, index) => (
            <span
              key={`${title}-${index}`}
              className="shrink-0 font-header text-xs text-white/95 sm:text-sm"
            >
              {title}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
