"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ShopPriceRangeSlider } from "@/components/shop/shop-price-range-slider";
import { useLanguage } from "@/contexts/language-context";
import type { ShopFiltersState } from "@/hooks/use-shop-filters";

type ShopFiltersToolbarProps = {
  filters: ShopFiltersState;
  className?: string;
  hasActiveFilters?: boolean;
};

export function ShopFiltersToolbar({ filters, className, hasActiveFilters }: ShopFiltersToolbarProps) {
  const { t } = useLanguage();
  const active = hasActiveFilters ?? filters.hasActiveFilters;

  return (
    <div className={className ?? "flex items-center gap-2 sm:gap-3"}>
      <Button
        variant="outline"
        onClick={() => filters.setShowFilters(!filters.showFilters)}
        className="flex items-center gap-2"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        {t("shop.filters")}
        {active && (
          <span className="ml-1 rounded-full bg-brand-champagne px-2 py-0.5 text-xs font-light text-brand-white">
            {filters.activeFilterCount || 1}
          </span>
        )}
      </Button>
    </div>
  );
}

type ShopSortRowProps = {
  sortBy: string;
  onSortByChange: (value: string) => void;
  className?: string;
};

export function ShopSortRow({ sortBy, onSortByChange, className }: ShopSortRowProps) {
  const { t } = useLanguage();

  return (
    <div className={className ?? "mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-end"}>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-brand-black sm:text-sm">{t("shop.sort")}</label>
        <Select value={sortBy} onChange={(e) => onSortByChange(e.target.value)} className="w-full sm:w-48">
          <option value="newest">{t("shop.newestFirst")}</option>
          <option value="oldest">{t("shop.oldestFirst")}</option>
          <option value="price-asc">{t("shop.priceLowToHigh")}</option>
          <option value="price-desc">{t("shop.priceHighToLow")}</option>
          <option value="name-asc">{t("shop.nameAtoZ")}</option>
          <option value="name-desc">{t("shop.nameZtoA")}</option>
        </Select>
      </div>
    </div>
  );
}

type ShopFiltersPanelProps = {
  filters: ShopFiltersState;
  children?: ReactNode;
  activeFilterTags?: ReactNode;
  onClearAll?: () => void;
  idPrefix?: string;
  showActiveFilters?: boolean;
};

export function ShopFiltersPanel({
  filters,
  children,
  activeFilterTags,
  onClearAll,
  idPrefix = "shop",
  showActiveFilters = true,
}: ShopFiltersPanelProps) {
  const { t } = useLanguage();
  const featuredId = `${idPrefix}-featured-only`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-brand-black">{t("shop.priceRange")}</label>
        <ShopPriceRangeSlider
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onMinPriceChange={filters.setMinPrice}
          onMaxPriceChange={filters.setMaxPrice}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-brand-black">{t("shop.sortBy")}</label>
        <Select value={filters.sortBy} onChange={(e) => filters.setSortBy(e.target.value)}>
          <option value="newest">{t("shop.newestFirst")}</option>
          <option value="oldest">{t("shop.oldestFirst")}</option>
          <option value="price-asc">{t("shop.priceLowToHigh")}</option>
          <option value="price-desc">{t("shop.priceHighToLow")}</option>
          <option value="name-asc">{t("shop.nameAtoZ")}</option>
          <option value="name-desc">{t("shop.nameZtoA")}</option>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-brand-black">{t("shop.options")}</label>
        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id={featuredId}
            checked={filters.showFeatured}
            onChange={(e) => filters.setShowFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-brand-champagne/30 text-brand-champagne focus:ring-2 focus:ring-brand-champagne"
          />
          <label htmlFor={featuredId} className="cursor-pointer text-sm font-light text-brand-black">
            {t("shop.featuredOnly")}
          </label>
        </div>
      </div>

      {children}

      {showActiveFilters && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-brand-black">{t("shop.activeFilters")}</label>
          <div className="flex flex-wrap gap-2 pt-2">
            {activeFilterTags}
            {filters.minPrice && (
              <span className="rounded bg-brand-champagne/20 px-2 py-1 text-xs font-light text-brand-black">
                Min: €{filters.minPrice}
              </span>
            )}
            {filters.maxPrice && (
              <span className="rounded bg-brand-champagne/20 px-2 py-1 text-xs font-light text-brand-black">
                Max: €{filters.maxPrice}
              </span>
            )}
            {filters.showFeatured && (
              <span className="rounded bg-brand-champagne/20 px-2 py-1 text-xs font-light text-brand-black">
                {t("shop.featuredOnly")}
              </span>
            )}
            {!filters.hasActiveFilters && !activeFilterTags && (
              <span className="text-xs font-light text-brand-champagne/60">{t("shop.noFiltersApplied")}</span>
            )}
          </div>
        </div>
      )}

      <Button variant="outline" onClick={onClearAll ?? filters.clearFilters} className="w-full">
        {t("shop.clearAll")}
      </Button>
    </div>
  );
}

type ShopFiltersDrawerProps = {
  filters: ShopFiltersState;
  children?: ReactNode;
  activeFilterTags?: ReactNode;
  onClearAll?: () => void;
};

export function ShopFiltersDrawer({ filters, children, activeFilterTags, onClearAll }: ShopFiltersDrawerProps) {
  const { t } = useLanguage();

  if (!filters.showFilters) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={() => filters.setShowFilters(false)}
        aria-label={t("common.close")}
      />
      <div className="absolute left-0 top-0 h-full w-full max-w-md overflow-y-auto bg-brand-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-champagne/20 bg-brand-white px-4 py-4 sm:px-6">
          <h2 className="text-xl font-medium text-brand-black">{t("shop.filters")}</h2>
          <button
            type="button"
            onClick={() => filters.setShowFilters(false)}
            className="flex size-9 items-center justify-center rounded-full border border-black/10 text-brand-black transition-colors hover:border-brand-champagne hover:bg-brand-champagne/10"
            aria-label={t("common.close")}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <ShopFiltersPanel
            filters={filters}
            onClearAll={onClearAll}
            activeFilterTags={activeFilterTags}
            idPrefix="shop-drawer"
          >
            {children}
          </ShopFiltersPanel>
        </div>

        <div className="sticky bottom-0 border-t border-brand-champagne/20 bg-brand-white px-4 py-3 sm:px-6">
          <Button onClick={() => filters.setShowFilters(false)} className="w-full">
            {t("shop.apply")}
          </Button>
        </div>
      </div>
    </div>
  );
}
