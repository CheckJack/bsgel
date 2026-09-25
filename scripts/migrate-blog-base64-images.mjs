#!/usr/bin/env node
/**
 * One-time migration: convert base64 blog images to files in /public/uploads/blogs/
 */
import { PrismaClient } from "@prisma/client"
import { mkdir, writeFile } from "fs/promises"
import path from "path"

const db = new PrismaClient()
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "blogs")

async function saveDataUrl(dataUrl) {
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

  return `/uploads/blogs/${filename}`
}

async function migrateContent(content) {
  if (!content?.includes("data:image/")) return content

  const dataUrlPattern = /data:image\/[\w+.-]+;base64,[^"'\s)]+/g
  const matches = [...new Set(content.match(dataUrlPattern) ?? [])]
  let updated = content

  for (const dataUrl of matches) {
    const fileUrl = await saveDataUrl(dataUrl)
    if (fileUrl) {
      updated = updated.split(dataUrl).join(fileUrl)
      console.log(`  content image -> ${fileUrl} (${Math.round(dataUrl.length / 1024)} KB)`)
    }
  }

  return updated
}

async function main() {
  const blogs = await db.blog.findMany({
    select: {
      id: true,
      title: true,
      image: true,
      heroImage: true,
      content: true,
    },
  })

  console.log(`Migrating ${blogs.length} blog posts...`)

  for (const blog of blogs) {
    let image = blog.image
    let heroImage = blog.heroImage
    let content = blog.content
    let changed = false

    if (image?.startsWith("data:image/")) {
      const url = await saveDataUrl(image)
      if (url) {
        console.log(`[${blog.title}] thumbnail ${Math.round(image.length / 1024)} KB -> ${url}`)
        image = url
        changed = true
      }
    }

    if (heroImage?.startsWith("data:image/")) {
      const url = await saveDataUrl(heroImage)
      if (url) {
        console.log(`[${blog.title}] hero ${Math.round(heroImage.length / 1024)} KB -> ${url}`)
        heroImage = url
        changed = true
      }
    }

    if (content?.includes("data:image/")) {
      const nextContent = await migrateContent(content)
      if (nextContent !== content) {
        content = nextContent
        changed = true
      }
    }

    if (changed) {
      await db.blog.update({
        where: { id: blog.id },
        data: { image, heroImage, content },
      })
    }
  }

  console.log("Done.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
