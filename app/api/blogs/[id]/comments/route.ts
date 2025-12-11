import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET comments for a blog post (only approved)
export async function GET(
  req: Request,
  { params }: { params: { blogId: string } }
) {
  try {
    const comments = await db.comment.findMany({
      where: {
        blogId: params.blogId,
        status: "APPROVED", // Only show approved comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Failed to fetch comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
}

// POST a new comment (requires authentication)
export async function POST(
  req: Request,
  { params }: { params: { blogId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to leave a comment" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      )
    }

    // Verify blog exists
    const blog = await db.blog.findUnique({
      where: { id: params.blogId },
    })

    if (!blog) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      )
    }

    // Create the comment (status defaults to PENDING)
    const comment = await db.comment.create({
      data: {
        blogId: params.blogId,
        userId: session.user.id,
        content: content.trim(),
        status: "PENDING", // Requires admin approval
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create comment:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create comment" },
      { status: 500 }
    )
  }
}

