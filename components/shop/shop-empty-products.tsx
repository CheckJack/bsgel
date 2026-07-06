"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

type ShopEmptyProductsProps = {
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  browseHref?: string;
  browseLabel?: string;
};

export function ShopEmptyProducts({
  hasActiveFilters = false,
  onClearFilters,
  browseHref = "/products",
  browseLabel,
}: ShopEmptyProductsProps) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center sm:py-20">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-brand-champagne/20 bg-brand-sweet-bianca/20">
        <SearchX className="h-7 w-7 text-brand-champagne" strokeWidth={1.5} aria-hidden />
      </div>

      <h3 className="font-display text-xl font-normal tracking-tight text-brand-black sm:text-2xl">
        {hasActiveFilters ? t("shop.emptyTitleFiltered") : t("shop.emptyTitle")}
      </h3>

      <p className="mt-3 text-sm font-light leading-relaxed text-brand-black/70 sm:text-base">
        {hasActiveFilters ? t("shop.emptyDescriptionFiltered") : t("shop.emptyDescription")}
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        {hasActiveFilters && onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            {t("shop.clearFilters")}
          </Button>
        )}
        <Link
          href={browseHref}
          className={cn(buttonVariants({ variant: hasActiveFilters ? "default" : "outline" }))}
        >
          {browseLabel ?? t("shop.browseAllProducts")}
        </Link>
      </div>
    </div>
  );
}
