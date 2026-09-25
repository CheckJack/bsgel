/**
 * URL-safe slug from a product name (or any label).
 * Keeps ASCII letters/digits; strips accents; collapses separators.
 */
export function slugifyProductName(input: string): string {
  const raw = String(input || "").trim();
  if (!raw) return "";

  const ascii = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .replace(/ð/g, "d")
    .replace(/þ/g, "th");

  return ascii
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Prefer public slug; fall back to id so links never break. */
export function productPublicKey(product: {
  id: string;
  slug?: string | null;
}): string {
  const slug = typeof product.slug === "string" ? product.slug.trim() : "";
  return slug || product.id;
}
