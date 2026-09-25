import { db } from "@/lib/db";
import { PRODUCT_LIST_SELECT, attachReviewStats } from "@/lib/products/list-select";
import { sanitizeProductList } from "@/lib/products/list-images";

export type ProductListQuery = {
  categoryId?: string | null;
  search?: string | null;
  featured?: boolean;
  showcasingSection?: string | null;
  showcasingSections?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: string;
  page?: number;
  limit?: number;
  skipReviews?: boolean;
  /** Hard cap. Public lists should stay small; admin can pass 1000. */
  maxLimit?: number;
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  price: string;
  salePrice: string | null;
  image: string | null;
  images: string[];
  featured: boolean;
  outOfStock: boolean;
  hemaFree: boolean;
  categoryId: string | null;
  createdAt: string;
  category: { id: string; name: string; slug: string } | null;
  reviewCount: number;
  rating: number;
};

export type ProductListResult = {
  products: ProductListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

function toNumber(value: string | number | null | undefined, fallback: number) {
  const parsed = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function serializePrice(value: unknown): string | null {
  if (value == null) return null;
  return typeof value === "string" ? value : String(value);
}

export async function getProductList(query: ProductListQuery): Promise<ProductListResult> {
  const maxLimit = Math.min(Math.max(query.maxLimit ?? 48, 1), 1000);
  const page = Math.max(toNumber(query.page, 1), 1);
  const limit = Math.min(Math.max(toNumber(query.limit, 12), 1), maxLimit);

  const where: any = {};
  const normalizedSearch = query.search?.trim() || "";
  const searchTokens = Array.from(
    new Set(
      normalizedSearch
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2)
    )
  );
  const isSearchRequest = searchTokens.length > 0;
  const normalizedSearchLower = normalizedSearch.toLowerCase();

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  if (isSearchRequest) {
    // Search name/category/id only — ILIKE on description is slow and unindexed.
    const tokenClauses = searchTokens.map((token) => ({
      OR: [
        { name: { contains: token, mode: "insensitive" } },
        { id: { contains: token, mode: "insensitive" } },
        { category: { name: { contains: token, mode: "insensitive" } } },
        { category: { slug: { contains: token, mode: "insensitive" } } },
      ],
    }));

    if (searchTokens.length === 1) {
      where.OR = tokenClauses[0].OR;
    } else {
      where.AND = tokenClauses;
    }
  }

  if (query.featured) {
    where.featured = true;
  }

  if (query.showcasingSection) {
    where.showcasingSections = { has: query.showcasingSection };
  } else if (query.showcasingSections && query.showcasingSections.length > 0) {
    where.showcasingSections = { hasSome: query.showcasingSections };
  }

  if (query.minPrice != null || query.maxPrice != null) {
    const price: Record<string, number> = {};
    if (query.minPrice != null && Number.isFinite(query.minPrice)) {
      price.gte = query.minPrice;
    }
    if (query.maxPrice != null && Number.isFinite(query.maxPrice)) {
      price.lte = query.maxPrice;
    }
    if (Object.keys(price).length > 0) {
      where.price = price;
    }
  }

  let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  switch (query.sortBy) {
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    case "name-asc":
      orderBy = { name: "asc" };
      break;
    case "name-desc":
      orderBy = { name: "desc" };
      break;
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [fetchedProducts, total] = await Promise.all([
    db.product.findMany({
      where,
      select: PRODUCT_LIST_SELECT,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  let products = fetchedProducts as any[];

  if (isSearchRequest) {
    products = [...products].sort((a, b) => {
      const scoreDiff =
        relevanceScore(b, normalizedSearchLower, searchTokens)
        - relevanceScore(a, normalizedSearchLower, searchTokens);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  if (!query.skipReviews && products.length > 0) {
    products = await attachReviewStats(db, products);
  } else {
    products = products.map((product) => ({
      ...product,
      reviewCount: product.reviewCount || 0,
      rating: product.rating || 0,
    }));
  }

  const listProducts = sanitizeProductList(products).map((product) => ({
    id: product.id,
    name: product.name,
    slug: (product as { slug?: string }).slug || product.id,
    price: serializePrice(product.price) || "0",
    salePrice: serializePrice(product.salePrice),
    image: product.image,
    images: product.images || [],
    featured: product.featured,
    outOfStock: product.outOfStock,
    hemaFree: product.hemaFree,
    categoryId: product.categoryId,
    createdAt:
      product.createdAt instanceof Date
        ? product.createdAt.toISOString()
        : String(product.createdAt),
    category: product.category,
    reviewCount: product.reviewCount || 0,
    rating: product.rating || 0,
  }));

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    products: listProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

function relevanceScore(
  product: { name?: string; id?: string; category?: { name?: string; slug?: string } | null },
  normalizedSearchLower: string,
  searchTokens: string[]
) {
  const name = (product?.name || "").toLowerCase();
  const productId = (product?.id || "").toLowerCase();
  const categoryName = (product?.category?.name || "").toLowerCase();
  const categorySlug = (product?.category?.slug || "").toLowerCase();
  const compactName = name.replace(/\s+/g, "");
  const compactSearch = normalizedSearchLower.replace(/\s+/g, "");

  let score = 0;
  if (name === normalizedSearchLower) score += 1000;
  if (name.startsWith(normalizedSearchLower)) score += 700;
  if (name.includes(normalizedSearchLower)) score += 500;
  if (compactSearch && compactName.includes(compactSearch)) score += 350;

  for (const token of searchTokens) {
    if (name.startsWith(token)) score += 140;
    if (name.includes(token)) score += 100;
    if (productId.includes(token)) score += 35;
    if (categoryName.includes(token) || categorySlug.includes(token)) score += 25;
  }

  return score;
}
