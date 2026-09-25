"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useHomepageProducts } from "@/contexts/homepage-products-context";
import { HomeProductsCarousel } from "@/components/layout/home-products-carousel";

export function FeaturedIntempuralProducts() {
  const { t } = useLanguage();
  const { products, isLoading } = useHomepageProducts("utensils");

  const labels = useMemo(
    () => ({
      ariaLabel: t("home.intempuralProducts"),
      tagline: t("home.intempuralProductsTagline"),
      heading: t("home.intempuralProducts"),
      description: t("home.intempuralProductsDesc"),
      viewAllHref: "/utensilios",
      viewAllLabel: t("home.viewAllIntempuralProducts"),
      loading: t("home.loadingProducts"),
      empty: t("home.noIntempuralProducts"),
      emptyViewAllHref: "/utensilios",
      emptyViewAllLabel: t("home.viewAllIntempuralProducts"),
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
