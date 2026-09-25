import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { PUBLIC_BLOG_LIST_SELECT } from "@/lib/blog"
import type { NewsPost } from "@/components/blog/news-utils"

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "blogs")
const BLOG_MEDIA_PREFIX = "/api/blogs/media/"

export function getBlogMediaUrl(filename: string): string {
  return `${BLOG_MEDIA_PREFIX}${filename}`
}

export function normalizeBlogMediaUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url
  if (url.startsWith(BLOG_MEDIA_PREFIX)) return url
  if (url.startsWith("/uploads/blogs/")) {
    const filename = url.slice("/uploads/blogs/".length)
    return getBlogMediaUrl(filename)
  }
  return url
}

export function normalizeBlogPostMedia<T extends { image?: string | null; heroImage?: string | null; content?: string }>(
  post: T
): T {
  let content = post.content
  if (content?.includes("/uploads/blogs/")) {
    content = content.replaceAll("/uploads/blogs/", "/api/blogs/media/")
  }

  return {
    ...post,
    image: normalizeBlogMediaUrl(post.image ?? null) ?? null,
    heroImage: normalizeBlogMediaUrl(post.heroImage ?? null) ?? null,
    ...(content !== undefined ? { content } : {}),
  }
}

export async function saveBlogDataUrl(dataUrl: string): Promise<string | null> {
  const match = dataUrl.match(/^data:(image\/[\w+.-]+);base64,([\s\S]+)$/)
  if (!match) return null

  const mime = match[1]
  const base64 = match[2]
  const extension =
    mime === "image/jpeg"
      ? "jpg"
      : mime === "image/png"
        ? "png"
        : mime === "image/webp"
          ? "webp"
          : mime === "image/gif"
            ? "gif"
            : mime === "image/avif"
              ? "avif"
              : "jpg"

  await mkdir(UPLOADS_DIR, { recursive: true })

  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${extension}`
  const filepath = path.join(UPLOADS_DIR, filename)
  const buffer = Buffer.from(base64, "base64")
  await writeFile(filepath, buffer)

  return getBlogMediaUrl(filename)
}

export async function migrateBlogImageField(
  value: string | null | undefined
): Promise<string | null | undefined> {
  if (!value?.startsWith("data:image/")) {
    return value
  }

  const url = await saveBlogDataUrl(value)
  return url ?? value
}

export async function migrateBlogContentImages(content: string): Promise<string> {
  const dataUrlPattern = /data:image\/[\w+.-]+;base64,[\s\S]*?(?=")/g
  const matches = Array.from(new Set(content.match(dataUrlPattern) ?? []))

  let updated = content
  for (const dataUrl of matches) {
    const fileUrl = await saveBlogDataUrl(dataUrl)
    if (fileUrl) {
      updated = updated.split(dataUrl).join(fileUrl)
    }
  }

  return updated
}

function serializePost<T extends { publishedAt: Date | null }>(
  post: T
): Omit<T, "publishedAt"> & { publishedAt: string | null } {
  return {
    ...post,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
  }
}

export async function getPublishedBlogPosts(limit?: number): Promise<NewsPost[]> {
  const posts = await db.blog.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { not: null },
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: PUBLIC_BLOG_LIST_SELECT,
    ...(limit ? { take: limit } : {}),
  })

  return posts.map((post) => normalizeBlogPostMedia(serializePost(post))) as NewsPost[]
}

export async function getPublishedBlogPostBySlug(slug: string) {
  const post = await db.blog.findUnique({
    where: { slug },
  })

  if (!post || post.status !== "PUBLISHED" || !post.publishedAt) {
    return null
  }

  return normalizeBlogPostMedia(serializePost(post))
}

export { isBlogDataUrl } from "@/components/blog/news-utils"
