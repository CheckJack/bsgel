"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useHomepageProducts } from "@/contexts/homepage-products-context";
import { HomeProductsCarousel } from "@/components/layout/home-products-carousel";

export function FeaturedSpaProducts() {
  const { t } = useLanguage();
  const { products, isLoading } = useHomepageProducts("spa");

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
    <HomeProductsCarousel
      labels={labels}
      products={products}
      isLoading={isLoading}
      viewportFit
    />
  );
}
