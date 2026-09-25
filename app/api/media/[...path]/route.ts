import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

function contentTypeFor(filePath: string) {
  return MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const segments = (await params).path || [];
    if (segments.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Prevent path traversal
    if (segments.some((s) => s === ".." || s.includes("\0"))) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const abs = path.join(UPLOAD_ROOT, ...segments);
    const resolved = path.resolve(abs);
    if (!resolved.startsWith(path.resolve(UPLOAD_ROOT) + path.sep)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const buf = await fs.readFile(resolved);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentTypeFor(resolved),
        "Content-Length": String(buf.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("media serve error:", err);
    return NextResponse.json({ error: "Failed to serve media" }, { status: 500 });
  }
}
