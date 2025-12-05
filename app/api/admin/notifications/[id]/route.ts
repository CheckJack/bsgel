import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { NotificationType } from "@prisma/client"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const notification = await db.notification.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      )
    }

    if (notification.type !== NotificationType.SYSTEM) {
      return NextResponse.json(
        { error: "This notification cannot be edited" },
        { status: 403 }
      )
    }

    return NextResponse.json(notification)
  } catch (error) {
    console.error("Failed to fetch notification:", error)
    return NextResponse.json(
      { error: "Failed to fetch notification" },
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const notification = await db.notification.findUnique({
      where: { id: params.id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      )
    }

    if (notification.type !== NotificationType.SYSTEM) {
      return NextResponse.json(
        { error: "This notification cannot be edited" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { title, message, linkUrl, image, isScheduled, scheduledFor } = body

    // Validation
    if (title !== undefined && !title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    if (message !== undefined && !message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    if (linkUrl !== undefined && !linkUrl) {
      return NextResponse.json(
        { error: "Link URL is required" },
        { status: 400 }
      )
    }

    if (isScheduled && !scheduledFor) {
      return NextResponse.json(
        { error: "Scheduled date/time is required when scheduling" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (message !== undefined) updateData.message = message
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl
    if (image !== undefined) updateData.image = image
    if (isScheduled !== undefined) updateData.isScheduled = isScheduled
    if (scheduledFor !== undefined) {
      updateData.scheduledFor = isScheduled && scheduledFor ? new Date(scheduledFor) : null
    }

    const updated = await db.notification.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "Notification updated successfully",
      notification: updated,
    })
  } catch (error) {
    console.error("Failed to update notification:", error)
    return NextResponse.json(
      { error: "Failed to update notification" },
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const notification = await db.notification.findUnique({
      where: { id: params.id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      )
    }

    if (notification.type !== NotificationType.SYSTEM) {
      return NextResponse.json(
        { error: "This notification cannot be deleted" },
        { status: 403 }
      )
    }

    await db.notification.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Notification deleted successfully" })
  } catch (error) {
    console.error("Failed to delete notification:", error)
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    )
  }
}

