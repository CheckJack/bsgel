import { NextResponse } from "next/server";
import { getHomepageProducts } from "@/lib/homepage/get-homepage-products";

export async function GET() {
  try {
    const payload = await getHomepageProducts();

    const headers = new Headers();
    headers.set(
      "Cache-Control",
      "public, max-age=30, s-maxage=60, stale-while-revalidate=120"
    );

    return NextResponse.json(payload, { headers });
  } catch (error) {
    console.error("Failed to fetch homepage products:", error);
    return NextResponse.json(
      { featured: [], spa: [], bases: [], utensils: [] },
      { status: 500 }
    );
  }
}
