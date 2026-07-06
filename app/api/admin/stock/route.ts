import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-stock-auth";
import { imageForListPayload } from "@/lib/product-image";

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const categoryId = searchParams.get("categoryId") || "";
  const stockStatus = searchParams.get("stockStatus") || "";
  const urgent = searchParams.get("urgent") === "true";
  const featured = searchParams.get("featured");
  const showcasingSection = searchParams.get("showcasingSection") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (categoryId) where.categoryId = categoryId;
  if (featured === "true") where.featured = true;
  if (featured === "false") where.featured = false;
  if (showcasingSection) {
    where.showcasingSections = { has: showcasingSection };
  }
  if (urgent) {
    where.stockQuantity = { gte: 1, lte: 2 };
  } else if (stockStatus === "out") {
    where.stockQuantity = { lte: 0 };
  } else if (stockStatus === "low") {
    where.stockQuantity = { gte: 1, lte: 2 };
  } else if (stockStatus === "in") {
    where.stockQuantity = { gte: 3 };
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ stockQuantity: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        image: true,
        price: true,
        salePrice: true,
        stockQuantity: true,
        outOfStock: true,
        featured: true,
        showcasingSections: true,
        category: { select: { id: true, name: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return NextResponse.json({
    products: products.map((p) => {
      const { image, hasImage } = imageForListPayload(p.image);
      return {
        id: p.id,
        name: p.name,
        image,
        hasImage,
        price: p.price.toString(),
        salePrice: p.salePrice?.toString() ?? null,
        stockQuantity: p.stockQuantity,
        outOfStock: p.outOfStock,
        featured: p.featured,
        showcasingSections: p.showcasingSections,
        category: p.category,
      };
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
