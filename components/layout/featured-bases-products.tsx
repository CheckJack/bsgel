"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useHomepageProducts } from "@/contexts/homepage-products-context";
import { HomeProductsCarousel } from "@/components/layout/home-products-carousel";

export function FeaturedBasesProducts() {
  const { t } = useLanguage();
  const { products, isLoading } = useHomepageProducts("bases");

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
    <HomeProductsCarousel
      labels={labels}
      products={products}
      isLoading={isLoading}
      viewportFit
    />
  );
}
