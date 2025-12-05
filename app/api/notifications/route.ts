import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const limit = parseInt(searchParams.get("limit") || "50")

    // Build where clause with proper conditions
    const whereConditions: any[] = []
    
    // Clients only see their own notifications
    if (session.user.role !== "ADMIN") {
      whereConditions.push({ userId: session.user.id })
    }
    
    // Respect scheduled notifications - only show if scheduledFor has passed or not scheduled
    whereConditions.push({
      OR: [
        { isScheduled: false },
        { 
          isScheduled: true,
          scheduledFor: { lte: new Date() }
        }
      ]
    })
    
    if (unreadOnly) {
      whereConditions.push({ read: false })
    }
    
    const where = whereConditions.length > 1 
      ? { AND: whereConditions }
      : whereConditions[0] || {}

    const notifications = await db.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    // Format notifications for the frontend
    const formattedNotifications = notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      image: notification.image,
      time: notification.createdAt.toISOString(),
      type: notification.type.toLowerCase(),
      read: notification.read,
      linkUrl: notification.linkUrl,
      metadata: notification.metadata,
    }))

    console.log(`📬 Returning ${formattedNotifications.length} notifications for ${session.user.role}`)

    return NextResponse.json(formattedNotifications)
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { notificationId, read, markAllAsRead } = body

    // Build where clause based on user role
    const where: any = {}
    if (session.user.role === "ADMIN") {
      // Admins can mark all notifications as read
      if (markAllAsRead) {
        where.read = false
      }
    } else {
      // Clients can only mark their own notifications
      where.userId = session.user.id
      if (markAllAsRead) {
        where.read = false
      }
    }

    if (markAllAsRead) {
      // Mark all notifications as read (filtered by user role)
      await db.notification.updateMany({
        where,
        data: { read: true },
      })
      return NextResponse.json({ message: "All notifications marked as read" })
    }

    if (notificationId && read !== undefined) {
      // First check if user owns this notification
      const notification = await db.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        )
      }

      // Clients can only update their own notifications
      if (session.user.role !== "ADMIN" && notification.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        )
      }

      // Mark specific notification as read/unread
      await db.notification.update({
        where: { id: notificationId },
        data: { read },
      })
      return NextResponse.json({ message: "Notification updated" })
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Failed to update notification:", error)
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    )
  }
}

