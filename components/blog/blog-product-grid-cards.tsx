"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { gridColumnClass } from "@/lib/blog-product-grid";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import { productPath } from "@/lib/products/paths";

export type BlogProductSummary = {
  id: string;
  slug?: string;
  name: string;
  price: string | number;
  salePrice?: string | number | null;
  image: string | null;
  outOfStock?: boolean;
};

type BlogProductGridCardsProps = {
  products: BlogProductSummary[];
  columns: number;
  preview?: boolean;
};

function displayPrice(product: BlogProductSummary): string | null {
  const sale = product.salePrice != null && product.salePrice !== "" ? product.salePrice : null;
  const base = product.price;
  if (sale) return formatPrice(sale);
  if (base != null && base !== "") return formatPrice(base);
  return null;
}

export function BlogProductGridCards({ products, columns, preview = false }: BlogProductGridCardsProps) {
  const { t } = useLanguage();

  if (products.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "blog-product-grid-cards grid items-start gap-6 sm:gap-8",
        gridColumnClass(columns),
        preview && "pointer-events-none"
      )}
    >
      {products.map((product) => {
        const priceLabel = displayPrice(product);

        return (
          <article
            key={product.id}
            className="blog-product-grid-card grid w-full grid-rows-[11rem_3.5rem_1.25rem_auto] sm:grid-rows-[12rem_3.5rem_1.25rem_auto]"
          >
            <Link
              href={productPath(product)}
              className={cn(
                "blog-product-grid-image-link group row-start-1 flex h-44 items-center justify-center sm:h-48",
                preview && "pointer-events-none"
              )}
              tabIndex={preview ? -1 : undefined}
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={320}
                  height={320}
                  className="h-auto max-h-full w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                />
              ) : (
                <div className="px-2 text-center text-xs uppercase tracking-wide text-brand-black/35">
                  {product.name}
                </div>
              )}
            </Link>

            <h3 className="blog-product-grid-name row-start-2 line-clamp-2 overflow-hidden pb-3 pt-4 font-header text-sm font-semibold leading-snug text-balance text-brand-black">
              {product.name}
            </h3>

            <div className="row-start-3 flex items-center">
              {priceLabel ? (
                <p className="font-header text-sm font-medium leading-none text-pink-900">{priceLabel}</p>
              ) : null}
              {product.outOfStock && (
                <p className="font-header text-[11px] uppercase tracking-wide text-brand-black/45">
                  {t("products.outOfStock")}
                </p>
              )}
            </div>

            <Link
              href={productPath(product)}
              className={cn(
                "blog-product-grid-cta row-start-4 mt-2.5 inline-flex w-full items-center justify-center border border-brand-black bg-brand-black px-4 py-2.5 font-header text-xs font-medium uppercase tracking-[0.12em] text-white no-underline transition-colors hover:bg-brand-black/90",
                preview && "pointer-events-none"
              )}
              tabIndex={preview ? -1 : undefined}
            >
              {t("common.learnMore")}
            </Link>
          </article>
        );
      })}
    </div>
  );
}
