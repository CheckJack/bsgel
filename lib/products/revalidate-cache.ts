import { revalidatePath } from "next/cache";
import { productPath } from "@/lib/products/paths";

const STOREFRONT_LIST_PATHS = [
  "/",
  "/products",
  "/colours",
  "/bio-gel",
  "/gemini",
  "/evo",
  "/spa",
  "/ethos",
  "/natural-nail-treatments",
] as const;

function safeRevalidate(path: string, type?: "page" | "layout") {
  try {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  } catch (err) {
    console.warn("[revalidateProductCache] failed for", path, err);
  }
}

export type ProductCacheTarget = {
  id: string;
  slug?: string | null;
  previousId?: string | null;
  previousSlug?: string | null;
};

/** Bust ISR / full-route cache after product create / update / delete. */
export function revalidateProductCache(target: ProductCacheTarget) {
  const paths = new Set<string>();

  for (const p of STOREFRONT_LIST_PATHS) paths.add(p);

  paths.add(productPath({ id: target.id, slug: target.slug }));
  paths.add(productPath(target.id));
  if (target.slug) paths.add(productPath(target.slug));

  if (target.previousId && target.previousId !== target.id) {
    paths.add(productPath(target.previousId));
  }
  if (target.previousSlug && target.previousSlug !== target.slug) {
    paths.add(productPath(target.previousSlug));
  }

  for (const path of Array.from(paths)) {
    safeRevalidate(path);
  }

  // Refresh nested product routes under /products
  safeRevalidate("/products", "layout");
}

/** Broader purge for admin "Clear site cache" — still no DB/file deletes. */
export function revalidateStorefrontCache() {
  for (const p of STOREFRONT_LIST_PATHS) {
    safeRevalidate(p);
  }
  safeRevalidate("/", "layout");
  safeRevalidate("/products", "layout");
  safeRevalidate("/blog", "layout");
}

/** Bulk edits — refresh listings once, plus a bounded set of product pages. */
export function revalidateProductsCache(ids: string[]) {
  revalidateStorefrontCache();
  const unique = Array.from(new Set(ids.filter(Boolean))).slice(0, 50);
  for (const id of unique) {
    safeRevalidate(productPath(id));
  }
}
