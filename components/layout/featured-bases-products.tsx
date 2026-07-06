"use client";

import { useCallback, useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import {
  HomeProductsCarousel,
  type CarouselProduct,
} from "@/components/layout/home-products-carousel";

function formatProducts(items: (CarouselProduct & { price?: unknown; salePrice?: unknown })[]) {
  return items.map((product) => ({
    ...product,
    price: product.price?.toString() || "0",
    salePrice: product.salePrice?.toString() ?? null,
  }));
}

async function fetchBasesProducts(): Promise<CarouselProduct[]> {
  const TARGET_COUNT = 12;
  const FETCH_LIMIT = 48;

  const res = await fetch(
    `/api/products?showcasingSection=bases&sortBy=newest&limit=${FETCH_LIMIT}`
  );
  if (!res.ok) return [];

  const data = await res.json();
  const items = (data.products || []) as (CarouselProduct & {
    price?: unknown;
    salePrice?: unknown;
  })[];

  return formatProducts(items.slice(0, TARGET_COUNT));
}

export function FeaturedBasesProducts() {
  const { t } = useLanguage();
  const loadProducts = useCallback(() => fetchBasesProducts(), []);

  const labels = useMemo(
    () => ({
      ariaLabel: t("home.basesProducts"),
      tagline: t("home.basesProductsTagline"),
      heading: t("home.basesProducts"),
      description: t("home.basesProductsDesc"),
      viewAllHref: "/bases",
      viewAllLabel: t("home.viewAllBasesProducts"),
      loading: t("home.loadingProducts"),
      empty: t("home.noBasesProducts"),
      emptyViewAllHref: "/bases",
      emptyViewAllLabel: t("home.viewAllBasesProducts"),
    }),
    [t]
  );

  return (
    <HomeProductsCarousel labels={labels} loadProducts={loadProducts} viewportFit />
  );
}
