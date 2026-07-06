import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getProductMediaAtIndex,
  isInlineMediaUrl,
  parseDataUrl,
} from "@/lib/products/list-images";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const index = Math.max(
      0,
      parseInt(new URL(req.url).searchParams.get("index") || "0", 10) || 0
    );

    const product = await db.product.findUnique({
      where: { id },
      select: { image: true, images: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const media = getProductMediaAtIndex(product.image, product.images, index);
    if (!media) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const cacheHeaders = {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    };

    if (isInlineMediaUrl(media)) {
      const parsed = parseDataUrl(media);
      if (!parsed) {
        return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
      }

      return new NextResponse(new Uint8Array(parsed.buffer), {
        status: 200,
        headers: {
          ...cacheHeaders,
          "Content-Type": parsed.mime,
          "Content-Length": String(parsed.buffer.length),
        },
      });
    }

    if (media.startsWith("http://") || media.startsWith("https://")) {
      return NextResponse.redirect(media, {
        status: 302,
        headers: cacheHeaders,
      });
    }

    if (media.startsWith("/")) {
      return NextResponse.redirect(new URL(media, req.url), {
        status: 302,
        headers: cacheHeaders,
      });
    }

    return NextResponse.json({ error: "Unsupported image URL" }, { status: 400 });
  } catch (error) {
    console.error("Failed to serve product image:", error);
    return NextResponse.json(
      { error: "Failed to serve product image" },
      { status: 500 }
    );
  }
}
