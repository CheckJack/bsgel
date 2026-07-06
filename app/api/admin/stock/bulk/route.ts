import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-stock-auth";
import { bulkUpdateProductStock } from "@/lib/stock";

export async function PATCH(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { productIds, stockQuantity } = body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: "productIds array is required" }, { status: 400 });
  }

  const qty = parseInt(String(stockQuantity), 10);
  if (Number.isNaN(qty) || qty < 0) {
    return NextResponse.json(
      { error: "Stock quantity must be a non-negative integer" },
      { status: 400 }
    );
  }

  try {
    const count = await bulkUpdateProductStock(productIds, qty);
    return NextResponse.json({ updated: count, stockQuantity: qty });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to bulk update stock";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
