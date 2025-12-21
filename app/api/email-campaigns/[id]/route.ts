import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EmailCampaignStatus } from "@prisma/client"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
  try {
    const campaign = await db.emailCampaign.findUnique({
      where: { id: id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Failed to fetch email campaign:", error)
    return NextResponse.json(
      { error: "Failed to fetch email campaign" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
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
      subject,
      content,
      pdfUrl,
      scheduledDate,
      status,
      recipientList,
      recipientType,
      reviewComments,
      assignedReviewerId,
    } = body

    const updateData: {
      subject?: string;
      content?: string;
      pdfUrl?: string | null;
      scheduledDate?: Date | null;
      status?: EmailCampaignStatus;
      recipientList?: string[];
      recipientType?: string;
      assignedReviewerId?: string | null;
      reviewedBy?: string;
      reviewedAt?: Date;
      reviewComments?: string;
    } = {}

    if (subject !== undefined) updateData.subject = subject
    if (content !== undefined) updateData.content = content
    if (pdfUrl !== undefined) updateData.pdfUrl = pdfUrl || null
    if (scheduledDate !== undefined) {
      updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null
    }
    if (recipientList !== undefined) updateData.recipientList = recipientList
    if (recipientType !== undefined) updateData.recipientType = recipientType

    // Handle status changes and review workflow
    if (status !== undefined) {
      updateData.status = status as EmailCampaignStatus
      
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
      const currentCampaign = await db.emailCampaign.findUnique({
        where: { id: id },
        select: { status: true },
      })
      if (currentCampaign?.status === "PENDING_REVIEW") {
        updateData.assignedReviewerId = assignedReviewerId || null
      }
    }

    if (reviewComments !== undefined && status === undefined) {
      updateData.reviewComments = reviewComments
    }

    const campaign = await db.emailCampaign.update({
      where: { id: id },
      data: updateData,
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Failed to update email campaign:", error)
    return NextResponse.json(
      { error: "Failed to update email campaign" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await db.emailCampaign.delete({
      where: { id: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete email campaign:", error)
    return NextResponse.json(
      { error: "Failed to delete email campaign" },
      { status: 500 }
    )
  }
}

