import { db } from "@/lib/db";
import { getProductList, type ProductListItem } from "@/lib/products/get-product-list";

export type HomepageCarouselProduct = {
  id: string;
  slug?: string;
  name: string;
  price: string;
  salePrice: string | null;
  image: string | null;
  images?: string[];
  category?: { name: string } | null;
  outOfStock?: boolean;
};

export type HomepageProductsPayload = {
  featured: HomepageCarouselProduct[];
  spa: HomepageCarouselProduct[];
  bases: HomepageCarouselProduct[];
  utensils: HomepageCarouselProduct[];
};

const TARGET_COUNT = 12;
const FETCH_LIMIT = 48;

const HOMEPAGE_FEATURED_EXCLUDED_NAME_PARTS = [
  "passion berry",
  "agenda cheia",
  "mini kit experiência",
  "workshop verniz gel",
  "curso terapeuta",
  "curso técnicas de verniz gel",
  "curso tecnicas de verniz gel",
];

const HOMEPAGE_SPA_EXCLUDED_IDS = new Set([
  "SPA06",
  "20ee6dd0-fd9b-4fd4-ac77-037ac7ea8b17",
  "SPA06-1",
  "24d5a8aa-9a42-4104-b83f-fb7f6b77f146",
  "c97b66c6-e93e-44fb-bb58-77cdfd2ffbb9",
  "8798952c-51e5-48b0-8793-0b21a53ee604",
  "3c20c924-b339-4b6e-8c9e-ebf1beb9e964",
]);

const HOMEPAGE_SPA_EXCLUDED_NAME_PARTS = [
  "creme de cutículas pack 10",
  "hand & body butter (manteiga mãos&corpo) - pack 6",
  "hand & body butter (manteiga mãos&corpo) 60 g",
  "summer heel (removedor calos prof",
  "summer heel - home care pack",
];

function toCarouselProduct(product: ProductListItem): HomepageCarouselProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    salePrice: product.salePrice,
    image: product.image,
    images: product.images,
    category: product.category ? { name: product.category.name } : null,
    outOfStock: product.outOfStock,
  };
}

function isExcludedFromHomepageFeatured(product: HomepageCarouselProduct): boolean {
  const name = product.name.toLowerCase();
  const category = product.category?.name?.toLowerCase() ?? "";
  if (category.includes("formação") || category.includes("formacao")) return true;
  return HOMEPAGE_FEATURED_EXCLUDED_NAME_PARTS.some((part) => name.includes(part));
}

function isExcludedFromHomepageSpa(product: HomepageCarouselProduct): boolean {
  if (HOMEPAGE_SPA_EXCLUDED_IDS.has(product.id)) return true;
  const name = product.name.toLowerCase();
  if (HOMEPAGE_SPA_EXCLUDED_NAME_PARTS.some((part) => name.includes(part))) return true;
  if (
    name.includes("hand & body butter") &&
    name.includes("manteiga") &&
    !name.includes("pack") &&
    (name.includes("60 g") || name.includes("60g") || product.price === "11.4" || product.price === "11.40")
  ) {
    return true;
  }
  return false;
}

function isIntempuralProductName(name: string): boolean {
  const normalized = String(name || "")
    .toLowerCase()
    .replace(/[\u00ae\u2122\ufe0f]/g, "")
    .replace(/®/g, "")
    .trim();
  return /intempural\s*$/i.test(normalized) || /intemporal\s*$/i.test(normalized);
}

async function getFeaturedProducts(): Promise<HomepageCarouselProduct[]> {
  const seen = new Set<string>();
  const merged: HomepageCarouselProduct[] = [];

  const addProducts = (items: ProductListItem[]) => {
    for (const item of items) {
      const product = toCarouselProduct(item);
      if (seen.has(product.id)) continue;
      if (isExcludedFromHomepageFeatured(product)) continue;
      seen.add(product.id);
      merged.push(product);
      if (merged.length >= TARGET_COUNT) return;
    }
  };

  const featured = await getProductList({
    featured: true,
    limit: TARGET_COUNT * 2,
    skipReviews: true,
  });
  addProducts(featured.products);

  if (merged.length < TARGET_COUNT) {
    const newest = await getProductList({
      sortBy: "newest",
      limit: TARGET_COUNT * 3,
      skipReviews: true,
    });
    addProducts(newest.products);
  }

  return merged;
}

async function getSpaProducts(): Promise<HomepageCarouselProduct[]> {
  const pickProducts = (items: ProductListItem[]) => {
    const selected: HomepageCarouselProduct[] = [];
    for (const item of items) {
      const product = toCarouselProduct(item);
      if (isExcludedFromHomepageSpa(product)) continue;
      selected.push(product);
      if (selected.length >= TARGET_COUNT) break;
    }
    return selected;
  };

  const spaCategory = await db.category.findFirst({
    where: { name: { equals: "spa", mode: "insensitive" } },
    select: { id: true },
  });

  if (spaCategory) {
    const byCategory = await getProductList({
      categoryId: spaCategory.id,
      sortBy: "newest",
      limit: FETCH_LIMIT,
      skipReviews: true,
    });
    const picked = pickProducts(byCategory.products);
    if (picked.length > 0) return picked;
  }

  const fallback = await getProductList({
    search: "spa",
    sortBy: "newest",
    limit: FETCH_LIMIT,
    skipReviews: true,
  });
  return pickProducts(fallback.products);
}

async function getBasesProducts(): Promise<HomepageCarouselProduct[]> {
  const result = await getProductList({
    showcasingSection: "bases",
    sortBy: "newest",
    limit: FETCH_LIMIT,
    skipReviews: true,
  });
  return result.products.slice(0, TARGET_COUNT).map(toCarouselProduct);
}

async function getUtensilsProducts(): Promise<HomepageCarouselProduct[]> {
  const result = await getProductList({
    showcasingSection: "utensilios",
    sortBy: "newest",
    limit: FETCH_LIMIT,
    skipReviews: true,
  });
  return result.products
    .filter((product) => isIntempuralProductName(product.name))
    .map(toCarouselProduct);
}

export async function getHomepageProducts(): Promise<HomepageProductsPayload> {
  const [featured, spa, bases, utensils] = await Promise.all([
    getFeaturedProducts(),
    getSpaProducts(),
    getBasesProducts(),
    getUtensilsProducts(),
  ]);

  return { featured, spa, bases, utensils };
}
