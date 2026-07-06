export const PRODUCT_LIST_SELECT = {
  id: true,
  name: true,
  price: true,
  salePrice: true,
  image: true,
  images: true,
  featured: true,
  outOfStock: true,
  hemaFree: true,
  categoryId: true,
  createdAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const;

export type ProductListRow = {
  id: string;
  name: string;
  price: unknown;
  salePrice: unknown;
  image: string | null;
  images: string[];
  featured: boolean;
  outOfStock: boolean;
  hemaFree: boolean;
  categoryId: string | null;
  createdAt: Date;
  category: { id: string; name: string; slug: string } | null;
  reviewCount?: number;
  rating?: number;
};

export async function attachReviewStats<T extends { id: string }>(
  db: {
    $queryRaw: <R>(query: TemplateStringsArray, ...values: unknown[]) => Promise<R>;
  },
  products: T[]
): Promise<(T & { reviewCount: number; rating: number })[]> {
  if (products.length === 0) return [];

  const productIds = products.map((product) => product.id);

  try {
    const reviewStats = await db.$queryRaw<
      Array<{ productId: string; reviewCount: bigint; avgRating: number }>
    >`
      SELECT
        "productId",
        COUNT(*)::int as "reviewCount",
        COALESCE(AVG(rating)::float, 0) as "avgRating"
      FROM "ProductReview"
      WHERE "productId" = ANY(${productIds}::text[])
        AND status = 'APPROVED'
      GROUP BY "productId"
    `;

    const statsMap = new Map(
      reviewStats.map((stat) => [
        stat.productId,
        {
          reviewCount: Number(stat.reviewCount),
          rating: Number(stat.avgRating),
        },
      ])
    );

    return products.map((product) => ({
      ...product,
      reviewCount: statsMap.get(product.id)?.reviewCount || 0,
      rating: statsMap.get(product.id)?.rating || 0,
    }));
  } catch {
    return products.map((product) => ({
      ...product,
      reviewCount: 0,
      rating: 0,
    }));
  }
}
