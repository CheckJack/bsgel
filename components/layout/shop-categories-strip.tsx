"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface ShopCategoriesStripProps {
  autoScroll?: boolean;
}

type CategoryItem = {
  href: string;
  labelKey: string;
  image: string;
};

const CATEGORY_ITEMS: CategoryItem[] = [
  { href: "/bio-gel", labelKey: "nav.shopMenu.bioGel", image: "/Lengthening.webp" },
  { href: "/gemini", labelKey: "nav.shopMenu.gemini", image: "/GEMINI.webp" },
  { href: "/colours", labelKey: "nav.shopMenu.colours", image: "/Biogel Colours.webp" },
  { href: "/ethos", labelKey: "nav.shopMenu.ethos", image: "/ETHOS (1).webp" },
  { href: "/spa", labelKey: "nav.shopMenu.spa", image: "/SPA.webp" },
  { href: "/evo", labelKey: "nav.shopMenu.evo", image: "/EVO (1).webp" },
  { href: "/bases", labelKey: "nav.shopMenu.bases", image: "/Bases.webp" },
  { href: "/softs", labelKey: "nav.shopMenu.softs", image: "/Softs.webp" },
  { href: "/eletronicos", labelKey: "nav.shopMenu.eletronicos", image: "/Electronics.webp" },
  { href: "/solventes", labelKey: "nav.shopMenu.solventes", image: "/Solvents.webp" },
  { href: "/tips", labelKey: "nav.shopMenu.tips", image: "/Tips.webp" },
  { href: "/utensilios", labelKey: "nav.shopMenu.utensilios", image: "/Utensils.webp" },
  { href: "/pinceis", labelKey: "nav.shopMenu.pinceis", image: "/Brushes (1).webp" },
  { href: "/lima-buffs", labelKey: "nav.shopMenu.limaBuffs", image: "/Buffs and Files.webp" },
];

export function ShopCategoriesStrip({ autoScroll = true }: ShopCategoriesStripProps) {
  void autoScroll;
  const { t } = useLanguage();

  const categories = useMemo(
    () =>
      CATEGORY_ITEMS.map((item) => ({
        ...item,
        label: t(item.labelKey),
      })),
    [t]
  );

  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const hasInteractedRef = useRef(false);

  const goTo = (index: number) => {
    hasInteractedRef.current = true;
    setCurrent((index + categories.length) % categories.length);
  };

  const goNext = () => goTo(current + 1);
  const goPrev = () => goTo(current - 1);

  useEffect(() => {
    if (!hasInteractedRef.current) return;

    const track = trackRef.current;
    if (!track) return;

    const slide = track.querySelector<HTMLElement>(`[data-slide-index="${current}"]`);
    if (!slide) return;

    track.scrollTo({
      left: slide.offsetLeft,
      behavior: "smooth",
    });
  }, [current]);

  return (
    <section
      className="flex w-full flex-col justify-center overflow-hidden bg-white"
      style={{ minHeight: "100dvh" }}
    >
      <div className="grid w-full auto-cols-fr grid-cols-1 items-center gap-8 px-[5%] py-8 sm:gap-12 sm:py-10 md:gap-16 lg:grid-cols-2 lg:gap-0 lg:px-0 lg:py-12">
        <div className="flex lg:justify-self-end">
          <div className="w-full max-w-md lg:ml-[5vw] lg:mr-20">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-black/70">
              {t("home.featuredProductsTagline")}
            </p>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-brand-black md:mb-4 md:text-4xl lg:text-5xl">
              {t("home.shopCategories")}
            </h2>
            <p className="text-sm text-brand-black/80 md:text-base">{t("home.shopCategoriesDesc")}</p>
          </div>
        </div>

        <div
          className="relative flex min-h-0 flex-col overflow-hidden lg:px-0"
          role="region"
          aria-roledescription="carousel"
          aria-label={t("home.shopCategories")}
        >
          <div
            ref={trackRef}
            className="ml-0 flex flex-1 items-center overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((category, index) => (
              <div
                key={category.href}
                role="group"
                aria-roledescription="slide"
                data-slide-index={index}
                className="flex min-w-0 shrink-0 grow-0 basis-[95%] items-center pl-0 pr-6 sm:basis-4/5 md:basis-1/2 md:pr-8 lg:basis-4/5"
              >
                <Link
                  href={category.href}
                  className="group flex w-full flex-col items-center outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-brand-champagne focus-visible:ring-offset-2"
                >
                  <div className="flex w-full items-center justify-center">
                    <img
                      src={category.image}
                      alt={category.label}
                      draggable={false}
                      className="block h-auto w-auto max-h-[min(52vh,520px)] max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <p className="mt-4 text-center text-base font-medium text-brand-black sm:text-lg">
                    {category.label}
                  </p>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 flex shrink-0 items-center justify-between sm:mt-12">
            <div className="flex gap-2 md:gap-4">
              <button
                type="button"
                aria-label="Previous slide"
                onClick={goPrev}
                className="inline-flex size-12 items-center justify-center rounded-full border border-black text-black transition-colors hover:bg-black/5"
              >
                <ArrowLeft className="size-6" />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={goNext}
                className="inline-flex size-12 items-center justify-center rounded-full border border-black text-black transition-colors hover:bg-black/5"
              >
                <ArrowRight className="size-6" />
              </button>
            </div>

            <div className="flex max-w-[50%] flex-wrap items-center justify-end gap-y-1 lg:absolute lg:right-16 lg:mt-5">
              {categories.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => goTo(index)}
                  className={`mx-[3px] inline-block size-2 rounded-full ${
                    current === index ? "bg-black" : "bg-neutral-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
