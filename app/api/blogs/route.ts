import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const published = searchParams.get("published") // For public-facing blog

    const where: any = {}

    // For public blog listing, only show published blogs
    if (published === "true") {
      where.status = "PUBLISHED"
      where.publishedAt = { not: null }
    } else if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ]
    }

    const blogs = await db.blog.findMany({
      where,
      orderBy: {
        publishedAt: "desc",
      },
    })

    return NextResponse.json(blogs)
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
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, slug, excerpt, content, image, author, status, publishedAt } = body

    if (!title || !slug) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingBlog = await db.blog.findUnique({
      where: { slug },
    })

    if (existingBlog) {
      return NextResponse.json(
        { error: "A blog with this slug already exists" },
        { status: 400 }
      )
    }

    const blog = await db.blog.create({
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        content: content || "",
        image: image || null,
        author: author || null,
        status: status || "DRAFT",
        publishedAt: status === "PUBLISHED" ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
      },
    })

    return NextResponse.json(blog, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create blog:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create blog" },
      { status: 500 }
    )
  }
}

