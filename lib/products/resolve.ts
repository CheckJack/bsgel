import { db } from "@/lib/db";
import { slugifyProductName } from "@/lib/products/slug";

/**
 * Build a unique product slug from a name.
 * On collision, appends -2, -3, … then falls back to -{idFragment}.
 */
export async function ensureUniqueProductSlug(
  name: string,
  opts?: { excludeProductId?: string; preferred?: string | null; idHint?: string }
): Promise<string> {
  const preferred = opts?.preferred?.trim()
    ? slugifyProductName(opts.preferred)
    : "";
  const base =
    preferred ||
    slugifyProductName(name) ||
    slugifyProductName(opts?.idHint || "") ||
    "product";

  const taken = new Set(
    (
      await db.product.findMany({
        where: { slug: { startsWith: base } },
        select: { id: true, slug: true },
      })
    )
      .filter((row) => row.id !== opts?.excludeProductId)
      .map((row) => row.slug)
  );

  if (!taken.has(base)) return base;

  for (let n = 2; n <= 50; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }

  const hint = slugifyProductName(opts?.idHint || opts?.excludeProductId || "") || "x";
  return `${base}-${hint}`.slice(0, 100);
}

/** Resolve a storefront/API param that may be either slug or id. */
export async function findProductIdByParam(param: string): Promise<string | null> {
  const key = decodeURIComponent(String(param || "")).trim();
  if (!key) return null;

  const bySlug = await db.product.findUnique({
    where: { slug: key },
    select: { id: true },
  });
  if (bySlug) return bySlug.id;

  const byId = await db.product.findUnique({
    where: { id: key },
    select: { id: true },
  });
  return byId?.id ?? null;
}

export async function getProductSeoByParam(param: string) {
  const key = decodeURIComponent(String(param || "")).trim();
  if (!key) return null;

  const select = {
    id: true,
    slug: true,
    name: true,
    description: true,
    price: true,
    salePrice: true,
    image: true,
    images: true,
    outOfStock: true,
    updatedAt: true,
    category: { select: { id: true, name: true, slug: true } },
  } as const;

  const bySlug = await db.product.findUnique({ where: { slug: key }, select });
  if (bySlug) return { product: bySlug, matchedBy: "slug" as const };

  const byId = await db.product.findUnique({ where: { id: key }, select });
  if (byId) return { product: byId, matchedBy: "id" as const };

  return null;
}
