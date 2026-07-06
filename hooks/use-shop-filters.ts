"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export function useShopFilters(initialSortBy = "newest") {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFeatured, setShowFeatured] = useState(false);

  useEffect(() => {
    if (!showFilters) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showFilters]);

  const clearFilters = useCallback(() => {
    setSortBy(initialSortBy);
    setMinPrice("");
    setMaxPrice("");
    setShowFeatured(false);
  }, [initialSortBy]);

  const hasActiveFilters = useMemo(
    () => Boolean(minPrice || maxPrice || sortBy !== initialSortBy || showFeatured),
    [minPrice, maxPrice, sortBy, initialSortBy, showFeatured]
  );

  const activeFilterCount = useMemo(
    () => [minPrice, maxPrice, showFeatured].filter(Boolean).length,
    [minPrice, maxPrice, showFeatured]
  );

  const appendToSearchParams = useCallback(
    (params: URLSearchParams) => {
      if (sortBy) params.set("sortBy", sortBy);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (showFeatured) params.set("featured", "true");
    },
    [sortBy, minPrice, maxPrice, showFeatured]
  );

  return {
    showFilters,
    setShowFilters,
    sortBy,
    setSortBy,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    showFeatured,
    setShowFeatured,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    appendToSearchParams,
  };
}

export type ShopFiltersState = ReturnType<typeof useShopFilters>;
