import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PRODUCT_LIST_SELECT } from "@/lib/products/list-select";
import { sanitizeProductList } from "@/lib/products/list-images";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids")?.trim() ?? "";
    const ids = Array.from(
      new Set(
        idsParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      )
    );

    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    if (ids.length > 12) {
      return NextResponse.json({ error: "Too many product ids" }, { status: 400 });
    }

    const products = await db.product.findMany({
      where: { id: { in: ids } },
      select: PRODUCT_LIST_SELECT,
    });

    const byId = new Map(products.map((product) => [product.id, product]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter((product): product is (typeof products)[number] => Boolean(product));

    return NextResponse.json(sanitizeProductList(ordered));
  } catch (error) {
    console.error("Failed to fetch products by ids:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
