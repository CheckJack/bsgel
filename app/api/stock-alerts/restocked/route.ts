import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ products: [] });
  }

  const alerts = await db.stockBackInStockAlert.findMany({
    where: {
      userId: session.user.id,
      notifiedAt: { not: null },
      product: { stockQuantity: { gt: 0 } },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          salePrice: true,
          image: true,
          stockQuantity: true,
          outOfStock: true,
          categoryId: true,
        },
      },
    },
    orderBy: { notifiedAt: "desc" },
    take: 8,
  });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const products = alerts
    .filter((a) => a.notifiedAt && a.notifiedAt >= since)
    .map((a) => ({
      id: a.product.id,
      name: a.product.name,
      price: a.product.price.toString(),
      salePrice: a.product.salePrice?.toString() ?? null,
      image: a.product.image,
      stockQuantity: a.product.stockQuantity,
      outOfStock: a.product.outOfStock,
      categoryId: a.product.categoryId,
    }));

  return NextResponse.json({ products });
}
