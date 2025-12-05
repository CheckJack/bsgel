import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { NotificationType } from "@prisma/client"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("perPage") || "50")
    const status = searchParams.get("status") // "all", "scheduled", "active", "expired"

    const where: any = {
      type: NotificationType.SYSTEM,
    }

    // Filter by status
    if (status === "scheduled") {
      where.isScheduled = true
      where.scheduledFor = { gt: new Date() }
    } else if (status === "active") {
      where.OR = [
        { isScheduled: false },
        { isScheduled: true, scheduledFor: { lte: new Date() } },
      ]
    }

    // Fetch all notifications for grouping (we'll paginate after grouping)
    const allNotifications = await db.notification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10000, // Reasonable limit
    })

    const total = await db.notification.count({ where })

    // Group notifications by title/message/linkUrl/scheduledFor to identify broadcast campaigns
    const notificationGroups = new Map<string, any[]>()
    
    allNotifications.forEach((notification) => {
      // Create a unique key for grouping notifications from the same campaign
      const scheduledStr = notification.scheduledFor?.toISOString() || "null"
      const key = `${notification.title}|${notification.message}|${notification.linkUrl}|${scheduledStr}`
      if (!notificationGroups.has(key)) {
        notificationGroups.set(key, [])
      }
      notificationGroups.get(key)!.push(notification)
    })

    // Format notifications, grouping broadcast campaigns
    const formattedNotifications: any[] = []
    
    notificationGroups.forEach((group) => {
      const first = group[0]
      const isBroadcast = group.length > 1 // Multiple notifications with same content = broadcast
      
      // Determine status
      let notificationStatus = "active"
      if (first.isScheduled) {
        const scheduledDate = first.scheduledFor
        if (scheduledDate && scheduledDate > new Date()) {
          notificationStatus = "scheduled"
        } else {
          notificationStatus = "active"
        }
      }

      const readCount = group.filter((n) => n.read).length
      const unreadCount = group.length - readCount

      formattedNotifications.push({
        id: first.id, // Use first notification's ID as representative
        title: first.title,
        message: first.message,
        linkUrl: first.linkUrl,
        image: first.image,
        type: first.type,
        scheduledFor: first.scheduledFor,
        isScheduled: first.isScheduled,
        createdAt: first.createdAt,
        updatedAt: first.updatedAt,
        status: notificationStatus,
        isBroadcast,
        totalUsers: group.length,
        readCount,
        unreadCount,
        notificationIds: group.map((n) => n.id), // Store all IDs for deletion/editing
        users: group.slice(0, 5).map((n) => n.user).filter(Boolean), // Show first 5 users
      })
    })

    // Sort by createdAt descending
    formattedNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Paginate after grouping
    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage
    const paginatedNotifications = formattedNotifications.slice(startIndex, endIndex)

    return NextResponse.json({
      notifications: paginatedNotifications,
      pagination: {
        page,
        perPage,
        total: formattedNotifications.length,
        totalPages: Math.ceil(formattedNotifications.length / perPage),
      },
    })
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      message,
      linkUrl,
      image,
      targetAudience,
      userIds,
      isScheduled,
      scheduledFor,
    } = body

    // Validation
    if (!title || !message || !linkUrl) {
      return NextResponse.json(
        { error: "Title, message, and link URL are required" },
        { status: 400 }
      )
    }

    if (targetAudience === "specific" && (!userIds || userIds.length === 0)) {
      return NextResponse.json(
        { error: "At least one user must be selected for specific targeting" },
        { status: 400 }
      )
    }

    if (isScheduled && !scheduledFor) {
      return NextResponse.json(
        { error: "Scheduled date/time is required when scheduling" },
        { status: 400 }
      )
    }

    const notifications: any[] = []

    if (targetAudience === "all") {
      // Fetch all user IDs to create notifications for each user
      const allUsers = await db.user.findMany({
        select: { id: true },
        where: { role: "USER" }, // Only send to regular users, not admins
      })

      for (const user of allUsers) {
        notifications.push({
          type: NotificationType.SYSTEM,
          title,
          message,
          linkUrl,
          image: image || null,
          userId: user.id,
          isScheduled: isScheduled || false,
          scheduledFor: isScheduled && scheduledFor ? new Date(scheduledFor) : null,
        })
      }
    } else {
      // Create individual notifications for each selected user
      for (const userId of userIds) {
        notifications.push({
          type: NotificationType.SYSTEM,
          title,
          message,
          linkUrl,
          image: image || null,
          userId,
          isScheduled: isScheduled || false,
          scheduledFor: isScheduled && scheduledFor ? new Date(scheduledFor) : null,
        })
      }
    }

    // Create all notifications in batches to avoid overwhelming the database
    let createdCount = 0
    const batchSize = 100

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      const result = await db.notification.createMany({
        data: batch,
      })
      createdCount += result.count
    }

    return NextResponse.json({
      message: "Notification(s) created successfully",
      count: createdCount,
    })
  } catch (error) {
    console.error("Failed to create notification:", error)
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    )
  }
}

