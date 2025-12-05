import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const post = await db.socialMediaPost.findUnique({
      where: { id: params.id },
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Failed to fetch social media post:", error)
    return NextResponse.json(
      { error: "Failed to fetch social media post" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      platform,
      contentType,
      caption,
      images,
      scheduledDate,
      status,
      reviewComments,
      hashtags,
      assignedReviewerId,
    } = body

    const updateData: any = {}

    if (platform !== undefined) updateData.platform = platform
    if (contentType !== undefined) updateData.contentType = contentType
    if (caption !== undefined) updateData.caption = caption
    if (images !== undefined) updateData.images = images
    if (scheduledDate !== undefined) updateData.scheduledDate = new Date(scheduledDate)
    if (hashtags !== undefined) updateData.hashtags = hashtags

    // Handle status changes and review workflow
    if (status !== undefined) {
      updateData.status = status
      
      // If status is PENDING_REVIEW, set assignedReviewerId
      if (status === "PENDING_REVIEW") {
        if (assignedReviewerId) {
          updateData.assignedReviewerId = assignedReviewerId
        }
      } else {
        // Clear assignedReviewerId if status is not PENDING_REVIEW
        updateData.assignedReviewerId = null
      }
      
      if (status === "APPROVED" || status === "REJECTED") {
        updateData.reviewedBy = session.user.id
        updateData.reviewedAt = new Date()
        if (reviewComments) {
          updateData.reviewComments = reviewComments
        }
      }
    }

    // Handle assignedReviewerId separately if status is not being updated
    if (assignedReviewerId !== undefined && status === undefined) {
      // Only update if current status is PENDING_REVIEW
      const currentPost = await db.socialMediaPost.findUnique({
        where: { id: params.id },
        select: { status: true },
      })
      if (currentPost?.status === "PENDING_REVIEW") {
        updateData.assignedReviewerId = assignedReviewerId || null
      }
    }

    if (reviewComments !== undefined && status === undefined) {
      updateData.reviewComments = reviewComments
    }

    const post = await db.socialMediaPost.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("Failed to update social media post:", error)
    return NextResponse.json(
      { error: "Failed to update social media post" },
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
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await db.socialMediaPost.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete social media post:", error)
    return NextResponse.json(
      { error: "Failed to delete social media post" },
      { status: 500 }
    )
  }
}

