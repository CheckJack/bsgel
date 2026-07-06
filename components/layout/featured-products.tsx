"use client";

import { useCallback, useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import {
  HomeProductsCarousel,
  type CarouselProduct,
} from "@/components/layout/home-products-carousel";

const HOMEPAGE_FEATURED_EXCLUDED_NAME_PARTS = [
  "passion berry",
  "agenda cheia",
  "mini kit experiência",
  "workshop verniz gel",
  "curso terapeuta",
  "curso técnicas de verniz gel",
  "curso tecnicas de verniz gel",
];

function isExcludedFromHomepageFeatured(product: CarouselProduct): boolean {
  const name = product.name.toLowerCase();
  const category = product.category?.name?.toLowerCase() ?? "";
  if (category.includes("formação") || category.includes("formacao")) return true;
  return HOMEPAGE_FEATURED_EXCLUDED_NAME_PARTS.some((part) => name.includes(part));
}

function formatProducts(items: (CarouselProduct & { price?: unknown; salePrice?: unknown })[]) {
  return items.map((product) => ({
    ...product,
    price: product.price?.toString() || "0",
    salePrice: product.salePrice?.toString() ?? null,
  }));
}

async function fetchFeaturedProducts(): Promise<CarouselProduct[]> {
  const loadProducts = async (query: string) => {
    const res = await fetch(query);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []) as (CarouselProduct & { price?: unknown; salePrice?: unknown })[];
  };

  const TARGET_COUNT = 12;
  const seen = new Set<string>();
  const merged: (CarouselProduct & { price?: unknown; salePrice?: unknown })[] = [];

  const addProducts = (items: (CarouselProduct & { price?: unknown; salePrice?: unknown })[]) => {
    for (const product of items) {
      if (seen.has(product.id)) continue;
      if (isExcludedFromHomepageFeatured(product)) continue;
      seen.add(product.id);
      merged.push(product);
      if (merged.length >= TARGET_COUNT) return;
    }
  };

  addProducts(await loadProducts(`/api/products?featured=true&limit=${TARGET_COUNT * 2}`));

  if (merged.length < TARGET_COUNT) {
    addProducts(await loadProducts(`/api/products?sortBy=newest&limit=${TARGET_COUNT * 3}`));
  }

  return formatProducts(merged);
}

export function FeaturedProducts() {
  const { t } = useLanguage();
  const loadProducts = useCallback(() => fetchFeaturedProducts(), []);

  const labels = useMemo(
    () => ({
      ariaLabel: t("home.featuredProducts"),
      tagline: t("home.featuredProductsTagline"),
      heading: t("home.featuredProducts"),
      description: t("home.featuredProductsDesc"),
      viewAllHref: "/products?featured=true",
      viewAllLabel: t("home.viewAllProducts"),
      loading: t("home.loadingProducts"),
      empty: t("home.noFeaturedProducts"),
      emptyViewAllHref: "/products",
      emptyViewAllLabel: t("home.viewAllProducts"),
    }),
    [t]
  );

  return (
    <HomeProductsCarousel labels={labels} loadProducts={loadProducts} viewportFit />
  );
}
