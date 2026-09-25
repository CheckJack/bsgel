import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "blogs")

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
}

function isSafeFilename(filename: string): boolean {
  return (
    !!filename &&
    !filename.includes("..") &&
    !filename.includes("/") &&
    !filename.includes("\\") &&
    /^[a-zA-Z0-9._-]+$/.test(filename)
  )
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  if (!isSafeFilename(filename)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const filepath = path.join(UPLOADS_DIR, filename)
    const buffer = await readFile(filepath)
    const extension = filename.split(".").pop()?.toLowerCase() || "jpg"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
