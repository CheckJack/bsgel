import type { ReactNode } from "react";

export const shopProductsTitleClassName =
  "font-display text-2xl font-normal tracking-tight text-brand-black sm:text-3xl md:text-4xl";

type ShopProductsTitleProps = {
  children: ReactNode;
};

export function ShopProductsTitle({ children }: ShopProductsTitleProps) {
  return (
    <>
      <h2 className={shopProductsTitleClassName}>{children}</h2>
      <div className="mt-3 h-1 w-16 bg-brand-champagne" />
    </>
  );
}
