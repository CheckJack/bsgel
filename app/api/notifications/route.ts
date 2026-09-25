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
    
    // Everyone sees their own notifications
    // Admins also see notifications with no userId (system-wide admin notifications)
    if (session.user.role === "ADMIN") {
      whereConditions.push({
        OR: [
          { userId: session.user.id },
          { userId: null }
        ]
      })
    } else {
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
      type: String(notification.type).toLowerCase(),
      read: notification.read,
      linkUrl: notification.linkUrl,
      metadata: notification.metadata,
    }))

    console.log(`📬 Returning ${formattedNotifications.length} notifications for ${session.user.role}`)

    return NextResponse.json(formattedNotifications)
  } catch (error: any) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications", details: error?.message || String(error) },
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
    const isAdmin = session.user.role === "ADMIN"

    // Inbox scope: own notifications; admins also see system-wide (userId null).
    // Never touch other users' notifications.
    const inboxScope = isAdmin
      ? { OR: [{ userId: session.user.id }, { userId: null }] }
      : { userId: session.user.id }

    if (markAllAsRead) {
      await db.notification.updateMany({
        where: {
          AND: [inboxScope, { read: false }],
        },
        data: { read: true },
      })
      return NextResponse.json({ message: "All notifications marked as read" })
    }

    if (notificationId && read !== undefined) {
      const notification = await db.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        )
      }

      const inInbox =
        notification.userId === session.user.id ||
        (isAdmin && notification.userId === null)

      if (!inInbox) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

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

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Match GET inbox scope: own notifications only.
    // Admins also clear system-wide alerts (userId null) — never other users' inboxes.
    const where =
      session.user.role === "ADMIN"
        ? { OR: [{ userId: session.user.id }, { userId: null }] }
        : { userId: session.user.id }

    const result = await db.notification.deleteMany({ where })

    console.log(
      `🗑️ Deleted ${result.count} notification(s) for ${session.user.role} (${session.user.id})`
    )

    return NextResponse.json({ 
      message: "All notifications deleted successfully",
      count: result.count 
    })
  } catch (error) {
    console.error("Failed to delete notifications:", error)
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 }
    )
  }
}

