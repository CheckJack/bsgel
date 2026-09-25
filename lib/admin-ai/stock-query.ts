import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type BulkStockTargetArgs = Record<string, unknown>;

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === "true";
}

export function buildBulkStockWhere(args: BulkStockTargetArgs): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  const search = String(args.search || "").trim();
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (args.categoryId) {
    where.categoryId = String(args.categoryId);
  }
  if (isTruthyFlag(args.urgent)) {
    where.stockQuantity = { gte: 1, lte: 2 };
  } else if (isTruthyFlag(args.outOfStock)) {
    where.stockQuantity = 0;
  }

  return where;
}

export async function resolveBulkStockProductIds(
  args: Record<string, unknown>
): Promise<{ productIds: string[]; total: number; error?: string }> {
  const allProducts = args.allProducts === true || args.allProducts === "true";

  if (allProducts) {
    const where = buildBulkStockWhere(args as BulkStockTargetArgs);
    const products = await db.product.findMany({
      where,
      select: { id: true },
      orderBy: { name: "asc" },
    });
    const productIds = products.map((p) => p.id);
    if (!productIds.length) {
      return { productIds: [], total: 0, error: "No products matched the filter." };
    }
    return { productIds, total: productIds.length };
  }

  const productIds = ((args.productIds as string[]) || []).filter(Boolean);
  if (!productIds.length) {
    return {
      productIds: [],
      total: 0,
      error: "Provide productIds for a specific list, or set allProducts:true for the full catalog.",
    };
  }

  return { productIds, total: productIds.length };
}
