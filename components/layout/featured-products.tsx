"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useHomepageProducts } from "@/contexts/homepage-products-context";
import { HomeProductsCarousel } from "@/components/layout/home-products-carousel";

export function FeaturedProducts() {
  const { t } = useLanguage();
  const { products, isLoading } = useHomepageProducts("featured");

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
    <HomeProductsCarousel
      labels={labels}
      products={products}
      isLoading={isLoading}
      viewportFit
    />
  );
}
