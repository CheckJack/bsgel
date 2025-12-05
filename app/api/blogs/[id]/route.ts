import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const blog = await db.blog.findUnique({
      where: { id: params.id },
    })

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json(blog)
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, slug, excerpt, content, image, author, status, publishedAt } = body

    // Check if blog exists
    const existingBlog = await db.blog.findUnique({
      where: { id: params.id },
    })

    if (!existingBlog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    // Check if slug is being changed and if new slug already exists
    if (slug && slug !== existingBlog.slug) {
      const slugExists = await db.blog.findUnique({
        where: { slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: "A blog with this slug already exists" },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (content !== undefined) updateData.content = content
    if (image !== undefined) updateData.image = image
    if (author !== undefined) updateData.author = author
    if (status !== undefined) {
      updateData.status = status
      // Set publishedAt when status changes to PUBLISHED
      if (status === "PUBLISHED" && !existingBlog.publishedAt) {
        updateData.publishedAt = publishedAt ? new Date(publishedAt) : new Date()
      }
    }
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt ? new Date(publishedAt) : null

    const blog = await db.blog.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(blog)
  } catch (error: any) {
    console.error("Failed to update blog:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update blog" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const blog = await db.blog.findUnique({
      where: { id: params.id },
    })

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    await db.blog.delete({
      where: { id: params.id },
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

