#!/usr/bin/env node
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  const blogs = await db.blog.findMany({
    select: { id: true, title: true, image: true, heroImage: true, content: true },
  })

  let updated = 0

  for (const blog of blogs) {
    const image = blog.image?.startsWith("/uploads/blogs/")
      ? blog.image.replace("/uploads/blogs/", "/api/blogs/media/")
      : blog.image
    const heroImage = blog.heroImage?.startsWith("/uploads/blogs/")
      ? blog.heroImage.replace("/uploads/blogs/", "/api/blogs/media/")
      : blog.heroImage
    const content = blog.content?.includes("/uploads/blogs/")
      ? blog.content.replaceAll("/uploads/blogs/", "/api/blogs/media/")
      : blog.content

    if (image !== blog.image || heroImage !== blog.heroImage || content !== blog.content) {
      await db.blog.update({
        where: { id: blog.id },
        data: { image, heroImage, content },
      })
      updated += 1
      console.log(`Updated: ${blog.title}`)
    }
  }

  console.log(`Done. Updated ${updated} posts.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
