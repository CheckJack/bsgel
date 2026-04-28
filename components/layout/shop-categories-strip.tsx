"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/language-context";

interface ShopCategoryItem {
  href: string;
  label: string;
  image: string;
}

export function ShopCategoriesStrip() {
  const { t } = useLanguage();

  const categories: ShopCategoryItem[] = [
    { href: "/bio-gel", label: t("nav.shopMenu.bioGel"), image: "/bio-gel-hero.svg" },
    { href: "/gemini", label: t("nav.shopMenu.gemini"), image: "/gemini-hero.svg" },
    { href: "/colours", label: t("nav.shopMenu.colours"), image: "/cores-hero.svg" },
    { href: "/ethos", label: t("nav.shopMenu.ethos"), image: "/ethos-hero.svg" },
    { href: "/spa", label: t("nav.shopMenu.spa"), image: "/spa-hero.svg" },
    { href: "/evo", label: t("nav.shopMenu.evo"), image: "/evo-hero.svg" },
    { href: "/bases", label: t("nav.shopMenu.bases"), image: "/bases-hero.svg" },
    { href: "/builders", label: t("nav.shopMenu.builders"), image: "/builders-hero.svg" },
    { href: "/softs", label: t("nav.shopMenu.softs"), image: "/softs-hero.svg" },
    { href: "/extensao", label: t("nav.shopMenu.extensao"), image: "/extensao-hero.svg" },
    { href: "/bundles", label: t("nav.shopMenu.bundles"), image: "/bundles-hero.svg" },
    { href: "/eletronicos", label: t("nav.shopMenu.eletronicos"), image: "/eletronicos-hero.svg" },
    { href: "/promocoes", label: t("nav.shopMenu.promocoes"), image: "/promocoes-hero.svg" },
    { href: "/kits-treino", label: t("nav.shopMenu.kitsTreino"), image: "/kits-e-treino-hero.svg" },
    { href: "/solventes", label: t("nav.shopMenu.solventes"), image: "/solventes-hero.svg" },
    { href: "/nail-art", label: t("nav.shopMenu.nailArt"), image: "/nail-art-hero.svg" },
    { href: "/tips", label: t("nav.shopMenu.tips"), image: "/tips-hero.svg" },
    { href: "/utensilios", label: t("nav.shopMenu.utensilios"), image: "/utensilios-hero.svg" },
    { href: "/pinceis", label: t("nav.shopMenu.pinceis"), image: "/pinceis-hero.svg" },
    { href: "/lima-buffs", label: t("nav.shopMenu.limaBuffs"), image: "/lima-buffs-hero.svg" },
  ];

  const animatedCategories = [...categories, ...categories];

  return (
    <section className="w-full overflow-hidden bg-white py-5 sm:py-6">
      <div className="px-4 sm:px-6">
        <div className="shop-categories-marquee flex w-max gap-6 sm:gap-7">
          {animatedCategories.map((category, idx) => (
            <Link
              key={`${category.href}-${idx}`}
              href={category.href}
              className="flex h-[188px] w-[188px] shrink-0 flex-col overflow-hidden rounded-md border border-gray-200 bg-white text-center transition-colors hover:border-brand-champagne sm:h-[220px] sm:w-[220px]"
            >
              <div className="relative h-[122px] w-full sm:h-[146px]">
                <Image
                  src={category.image}
                  alt={category.label}
                  fill
                  className="object-cover"
                  sizes="118px"
                  unoptimized
                />
              </div>
              <div className="flex flex-1 items-center justify-center px-2">
                <span className="line-clamp-2 text-base font-medium text-brand-black sm:text-lg">
                  {category.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <style jsx>{`
        .shop-categories-marquee {
          animation: categories-marquee 45s linear infinite;
        }
        .shop-categories-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes categories-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
