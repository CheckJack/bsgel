import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateStorefrontCache } from "@/lib/products/revalidate-cache";

export const dynamic = "force-dynamic";

/**
 * Admin-only: bust Next.js storefront ISR/page cache.
 * Does not delete products, files, or database rows.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    revalidateStorefrontCache();

    return NextResponse.json({
      ok: true,
      message: "Storefront cache cleared. Product and listing pages will refresh on next visit.",
    });
  } catch (error) {
    console.error("Failed to revalidate storefront cache:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}
