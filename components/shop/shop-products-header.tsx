"use client";

import type { ReactNode } from "react";
import { ShopFiltersDrawer, ShopFiltersToolbar } from "@/components/shop/shop-filters";
import type { ShopFiltersState } from "@/hooks/use-shop-filters";

type ShopProductsHeaderProps = {
  title: ReactNode;
  filters: ShopFiltersState;
};

export function ShopProductsHeader({ title, filters }: ShopProductsHeaderProps) {
  return (
    <>
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:mb-6 sm:flex-row sm:items-center">
        <div>{title}</div>
        <ShopFiltersToolbar filters={filters} />
      </div>
      <ShopFiltersDrawer filters={filters} />
    </>
  );
}
