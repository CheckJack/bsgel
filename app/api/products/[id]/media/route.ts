import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeProductMediaBuffer } from "@/lib/products/persist-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_PREFIXES = ["image/", "video/"] as const;

/**
 * Admin multipart upload for product gallery / attribute media.
 * Saves to disk and returns a public URL — avoids huge base64 JSON PATCH bodies
 * that Nginx rejects (413 Request Entity Too Large).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await params;
    const productId = String(rawId || "").trim();
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Allow upload for known product IDs even before the row exists (new product form).
    // Admin-only; files land under public/uploads/products/{id}/.

    const formData = await req.formData();
    const file = formData.get("file");
    const hintRaw = formData.get("hint");
    const hint =
      typeof hintRaw === "string" && hintRaw.trim()
        ? hintRaw.trim().replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40)
        : "upload";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Media file is required" }, { status: 400 });
    }

    if (!ALLOWED_PREFIXES.some((p) => file.type.startsWith(p))) {
      return NextResponse.json(
        { error: "Unsupported file type. Use an image or video." },
        { status: 400 }
      );
    }

    if (!file.size || file.size <= 0) {
      return NextResponse.json(
        {
          error:
            "File is empty. If this file is in iCloud/cloud storage, download it to the device first, then upload again.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 25 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.length) {
      return NextResponse.json(
        {
          error:
            "File is empty. Download it locally first if it lives in cloud storage, then upload again.",
        },
        { status: 400 }
      );
    }

    const url = await writeProductMediaBuffer(
      productId,
      buffer,
      file.type || "application/octet-stream",
      hint
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Failed to upload product media:", error);
    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
  }
}
