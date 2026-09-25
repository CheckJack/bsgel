import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  applyPublishState,
  isValidBlogStatus,
  normalizeBlogStatus,
  normalizeSlug,
  PUBLIC_BLOG_LIST_SELECT,
} from "@/lib/blog"
import { normalizeBlogPostMedia } from "@/lib/blog-public"

async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "ADMIN") {
    return null
  }

  return session
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const published = searchParams.get("published")

    const where: Record<string, unknown> = {}
    const andFilters: Record<string, unknown>[] = []

    if (published === "true") {
      andFilters.push({ status: "PUBLISHED" })
      andFilters.push({ publishedAt: { not: null } })
    } else {
      const session = await requireAdmin()
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      if (status === "DRAFT") {
        andFilters.push({
          OR: [
            { status: "DRAFT" },
            { status: "PENDING_REVIEW" },
            { status: "APPROVED" },
            { status: "REJECTED" },
          ],
        })
      } else if (status === "PUBLISHED") {
        andFilters.push({ status: "PUBLISHED" })
      } else if (status) {
        andFilters.push({ status })
      }
    }

    if (search) {
      andFilters.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { excerpt: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      })
    }

    if (andFilters.length > 0) {
      where.AND = andFilters
    }

    const blogs = await db.blog.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: published === "true" ? PUBLIC_BLOG_LIST_SELECT : undefined,
    })

    const response = NextResponse.json(blogs.map((blog) => normalizeBlogPostMedia(blog)))

    if (published === "true") {
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=600"
      )
    }

    return response
  } catch (error) {
    console.error("Failed to fetch blogs:", error)
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      slug,
      excerpt,
      content,
      image,
      heroImage,
      author,
      status,
    } = body

    if (!title?.trim() || !slug?.trim()) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 }
      )
    }

    const normalizedSlug = normalizeSlug(slug)

    if (!normalizedSlug) {
      return NextResponse.json(
        { error: "Slug must contain letters or numbers" },
        { status: 400 }
      )
    }

    const requestedStatus = status || "DRAFT"
    if (!isValidBlogStatus(requestedStatus)) {
      return NextResponse.json(
        { error: "Status must be DRAFT or PUBLISHED" },
        { status: 400 }
      )
    }

    const existingBlog = await db.blog.findUnique({
      where: { slug: normalizedSlug },
    })

    if (existingBlog) {
      return NextResponse.json(
        { error: "A blog with this slug already exists" },
        { status: 400 }
      )
    }

    const publishState = applyPublishState(
      normalizeBlogStatus(requestedStatus),
      null
    )

    const blog = await db.blog.create({
      data: {
        title: title.trim(),
        slug: normalizedSlug,
        excerpt: excerpt?.trim() || null,
        content: content || "",
        image: image || null,
        heroImage: heroImage || null,
        author: author?.trim() || null,
        status: publishState.status,
        publishedAt: publishState.publishedAt,
        assignedReviewerId: null,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json(blog, { status: 201 })
  } catch (error: unknown) {
    console.error("Failed to create blog:", error)
    const message = error instanceof Error ? error.message : "Failed to create blog"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
