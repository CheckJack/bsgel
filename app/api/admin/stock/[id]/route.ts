import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-stock-auth";
import { updateProductStock } from "@/lib/stock";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      images: true,
      price: true,
      salePrice: true,
      stockQuantity: true,
      outOfStock: true,
      featured: true,
      category: { select: { id: true, name: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...product,
    price: product.price.toString(),
    salePrice: product.salePrice?.toString() ?? null,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const stockQuantity = parseInt(String(body.stockQuantity), 10);

  if (Number.isNaN(stockQuantity) || stockQuantity < 0) {
    return NextResponse.json(
      { error: "Stock quantity must be a non-negative integer" },
      { status: 400 }
    );
  }

  try {
    const updated = await updateProductStock(id, stockQuantity);
    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to update stock";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
