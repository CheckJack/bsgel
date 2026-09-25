import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { authOptions } from "@/lib/auth"

const MAX_FILE_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
])

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image type. Use JPEG, PNG, WebP, GIF, or AVIF." },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Image is too large. Maximum size is 8 MB." },
        { status: 400 }
      )
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "blogs")
    await mkdir(uploadsDir, { recursive: true })

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg"
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${safeExtension}`
    const filepath = path.join(uploadsDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    return NextResponse.json({
      url: `/api/blogs/media/${filename}`,
    })
  } catch (error) {
    console.error("Failed to upload blog image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
