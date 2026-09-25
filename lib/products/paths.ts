/** Safe storefront path for a product (slug preferred; id fallback). */
export function productPath(
  productOrId: string | { id: string; slug?: string | null }
): string {
  if (typeof productOrId === "string") {
    const id = productOrId.trim();
    if (!id) return "/products";
    return `/products/${encodeURIComponent(id)}`;
  }

  const slug = typeof productOrId.slug === "string" ? productOrId.slug.trim() : "";
  const key = slug || String(productOrId.id || "").trim();
  if (!key) return "/products";
  return `/products/${encodeURIComponent(key)}`;
}

/** Encode a product id for use in `/api/products/...` paths (always the real id). */
export function productApiPath(productId: string, suffix = ""): string {
  const id = String(productId || "").trim();
  const base = `/api/products/${encodeURIComponent(id)}`;
  return suffix ? `${base}${suffix.startsWith("/") ? suffix : `/${suffix}`}` : base;
}
