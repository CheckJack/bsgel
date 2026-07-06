"use client";

import { useCallback, useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import {
  HomeProductsCarousel,
  type CarouselProduct,
} from "@/components/layout/home-products-carousel";

/** Products excluded from the homepage SPA carousel (replaced by other SPA items). */
const HOMEPAGE_SPA_EXCLUDED_IDS = new Set([
  "SPA06",
  "20ee6dd0-fd9b-4fd4-ac77-037ac7ea8b17", // Creme de Cutículas Pack 10 Unid
  "SPA06-1",
  "24d5a8aa-9a42-4104-b83f-fb7f6b77f146", // Hand & Body Butter - Pack 6 Unid.
  "c97b66c6-e93e-44fb-bb58-77cdfd2ffbb9", // Hand & Body Butter 60 g (legacy id)
  "8798952c-51e5-48b0-8793-0b21a53ee604", // Summer Heel (Removedor Calos Prof.)
  "3c20c924-b339-4b6e-8c9e-ebf1beb9e964", // Summer Heel - Home Care Pack
]);

const HOMEPAGE_SPA_EXCLUDED_NAME_PARTS = [
  "creme de cutículas pack 10",
  "hand & body butter (manteiga mãos&corpo) - pack 6",
  "hand & body butter (manteiga mãos&corpo) 60 g",
  "summer heel (removedor calos prof",
  "summer heel - home care pack",
];

function isExcludedFromHomepageSpa(product: CarouselProduct): boolean {
  if (HOMEPAGE_SPA_EXCLUDED_IDS.has(product.id)) return true;
  const name = product.name.toLowerCase();
  if (HOMEPAGE_SPA_EXCLUDED_NAME_PARTS.some((part) => name.includes(part))) return true;
  // Single 60 g Hand & Body Butter at 11,40 € (name may omit size suffix)
  if (
    name.includes("hand & body butter") &&
    name.includes("manteiga") &&
    !name.includes("pack") &&
    (name.includes("60 g") || name.includes("60g") || product.price === "11.4" || product.price === "11.40")
  ) {
    return true;
  }
  return false;
}

function formatProducts(items: (CarouselProduct & { price?: unknown; salePrice?: unknown })[]) {
  return items.map((product) => ({
    ...product,
    price: product.price?.toString() || "0",
    salePrice: product.salePrice?.toString() ?? null,
  }));
}

async function fetchSpaProducts(): Promise<CarouselProduct[]> {
  const TARGET_COUNT = 12;
  const FETCH_LIMIT = 48;

  const loadProducts = async (query: string) => {
    const res = await fetch(query);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []) as (CarouselProduct & { price?: unknown; salePrice?: unknown })[];
  };

  const pickProducts = (items: (CarouselProduct & { price?: unknown; salePrice?: unknown })[]) => {
    const selected: (CarouselProduct & { price?: unknown; salePrice?: unknown })[] = [];
    for (const product of items) {
      const formatted = {
        ...product,
        price: product.price?.toString() || "0",
        salePrice: product.salePrice?.toString() ?? null,
      };
      if (isExcludedFromHomepageSpa(formatted)) continue;
      selected.push(product);
      if (selected.length >= TARGET_COUNT) break;
    }
    return formatProducts(selected);
  };

  const categoriesRes = await fetch("/api/categories");
  if (categoriesRes.ok) {
    const categoriesData = await categoriesRes.json();
    const spaCategory = categoriesData.categories?.find(
      (cat: { name: string }) => cat.name.toLowerCase() === "spa"
    );

    if (spaCategory) {
      const items = await loadProducts(
        `/api/products?categoryId=${spaCategory.id}&sortBy=newest&limit=${FETCH_LIMIT}`
      );
      const picked = pickProducts(items);
      if (picked.length > 0) return picked;
    }
  }

  const fallback = await loadProducts(`/api/products?search=spa&sortBy=newest&limit=${FETCH_LIMIT}`);
  return pickProducts(fallback);
}

export function FeaturedSpaProducts() {
  const { t } = useLanguage();
  const loadProducts = useCallback(() => fetchSpaProducts(), []);

  const labels = useMemo(
    () => ({
      ariaLabel: t("home.spaProducts"),
      tagline: t("home.spaProductsTagline"),
      heading: t("home.spaProducts"),
      description: t("home.spaProductsDesc"),
      viewAllHref: "/spa",
      viewAllLabel: t("home.viewAllSpaProducts"),
      loading: t("home.loadingProducts"),
      empty: t("home.noSpaProducts"),
      emptyViewAllHref: "/spa",
      emptyViewAllLabel: t("home.viewAllSpaProducts"),
    }),
    [t]
  );

  return (
    <HomeProductsCarousel labels={labels} loadProducts={loadProducts} viewportFit />
  );
}
