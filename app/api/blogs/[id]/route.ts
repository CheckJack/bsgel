import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  applyPublishState,
  isValidBlogStatus,
  normalizeBlogStatus,
  normalizeSlug,
  toAdminBlogStatus,
} from "@/lib/blog"
import { normalizeBlogPostMedia } from "@/lib/blog-public"

async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "ADMIN") {
    return null
  }

  return session
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await requireAdmin()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const blog = await db.blog.findUnique({
      where: { id },
    })

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...normalizeBlogPostMedia(blog),
      status: toAdminBlogStatus(blog.status),
    })
  } catch (error) {
    console.error("Failed to fetch blog:", error)
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await requireAdmin()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, slug, excerpt, content, image, heroImage, author, status } =
      body

    const existingBlog = await db.blog.findUnique({
      where: { id },
    })

    if (!existingBlog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (title !== undefined) {
      if (!title?.trim()) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 })
      }
      updateData.title = title.trim()
    }

    if (slug !== undefined) {
      const normalizedSlug = normalizeSlug(slug)
      if (!normalizedSlug) {
        return NextResponse.json(
          { error: "Slug must contain letters or numbers" },
          { status: 400 }
        )
      }

      if (normalizedSlug !== existingBlog.slug) {
        const slugExists = await db.blog.findUnique({
          where: { slug: normalizedSlug },
        })

        if (slugExists) {
          return NextResponse.json(
            { error: "A blog with this slug already exists" },
            { status: 400 }
          )
        }
      }

      updateData.slug = normalizedSlug
    }

    if (excerpt !== undefined) updateData.excerpt = excerpt?.trim() || null
    if (content !== undefined) updateData.content = content || ""
    if (image !== undefined) updateData.image = image || null
    if (heroImage !== undefined) updateData.heroImage = heroImage || null
    if (author !== undefined) updateData.author = author?.trim() || null

    if (status !== undefined) {
      if (!isValidBlogStatus(status)) {
        return NextResponse.json(
          { error: "Status must be DRAFT or PUBLISHED" },
          { status: 400 }
        )
      }

      const publishState = applyPublishState(
        normalizeBlogStatus(status),
        existingBlog.publishedAt
      )

      updateData.status = publishState.status
      updateData.publishedAt = publishState.publishedAt
      updateData.assignedReviewerId = null
      updateData.reviewedBy = null
      updateData.reviewedAt = null
      updateData.reviewComments = null
    }

    const blog = await db.blog.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      ...normalizeBlogPostMedia(blog),
      status: toAdminBlogStatus(blog.status),
    })
  } catch (error: unknown) {
    console.error("Failed to update blog:", error)
    const message = error instanceof Error ? error.message : "Failed to update blog"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await requireAdmin()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const blog = await db.blog.findUnique({
      where: { id },
    })

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    await db.blog.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Blog deleted successfully" })
  } catch (error) {
    console.error("Failed to delete blog:", error)
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    )
  }
}
