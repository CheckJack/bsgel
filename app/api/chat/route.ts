import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Retrieve messages (user sees their own, admin sees all)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const { searchParams } = new URL(req.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    
    // Filtering
    const filter = searchParams.get("filter") || "all"; // all, unread, replied, not_replied
    const search = searchParams.get("search") || "";
    
    // Sorting
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortDirection = searchParams.get("sortDirection") || "desc";

    // Build base where clause
    const baseWhere: any = isAdmin ? {} : { userId: session.user.id };

    // Apply filters
    if (filter === "unread") {
      baseWhere.readByAdmin = false;
    } else if (filter === "replied") {
      baseWhere.adminResponse = { not: null };
    } else if (filter === "not_replied") {
      baseWhere.adminResponse = null;
    }

    // Apply search
    let where = baseWhere;
    if (search.trim()) {
      const searchTerm = search.trim();
      
      // First, try to find matching users if search looks like email or name
      let matchingUserIds: string[] = [];
      try {
        const matchingUsers = await db.user.findMany({
          where: {
            OR: [
              { email: { contains: searchTerm, mode: "insensitive" as const } },
              { name: { contains: searchTerm, mode: "insensitive" as const } },
            ],
          },
          select: { id: true },
        });
        matchingUserIds = matchingUsers.map((u) => u.id);
      } catch (error) {
        console.error("Error searching users:", error);
      }

      // Build search conditions
      const searchConditions: any[] = [
        { message: { contains: searchTerm, mode: "insensitive" as const } },
        { adminResponse: { contains: searchTerm, mode: "insensitive" as const } },
      ];

      // If we found matching users, add user ID search
      if (matchingUserIds.length > 0) {
        searchConditions.push({ userId: { in: matchingUserIds } });
      }

      // Combine base where with search OR
      const hasBaseConditions = Object.keys(baseWhere).length > 0;
      if (hasBaseConditions) {
        where = {
          AND: [
            baseWhere,
            {
              OR: searchConditions,
            },
          ],
        };
      } else {
        where = {
          OR: searchConditions,
        };
      }
    }

    // Get total count for pagination
    const total = await db.chatMessage.count({ where });

    // Build orderBy
    const orderBy: any = {};
    if (sortField === "createdAt" || sortField === "readByAdmin" || sortField === "readAt") {
      orderBy[sortField] = sortDirection;
    } else if (sortField === "user") {
      orderBy.user = { name: sortDirection };
    } else {
      orderBy.createdAt = "desc";
    }

    // Fetch messages
    const messages = await db.chatMessage.findMany({
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
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      dbAvailable: !!db,
      chatMessageAvailable: !!(db as any).chatMessage,
    });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch messages: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST - Send a new message (users only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only regular users can send messages, not admins
    if (session.user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admins cannot send messages through this endpoint" },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const chatMessage = await db.chatMessage.create({
      data: {
        userId: session.user.id,
        message: message.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Create notification for admin users
    try {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      });

      await db.notification.create({
        data: {
          type: "SYSTEM",
          title: "New Chat Message",
          message: `New message from ${user?.name || user?.email || "Customer"}`,
          metadata: {
            chatMessageId: chatMessage.id,
            userId: session.user.id,
            customerName: user?.name || null,
            customerEmail: user?.email || null,
          },
        },
      });
    } catch (notificationError) {
      console.error("Failed to create chat notification:", notificationError);
    }

    return NextResponse.json(chatMessage, { status: 201 });
  } catch (error) {
    console.error("Failed to create message:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      dbAvailable: !!db,
      chatMessageAvailable: !!(db as any).chatMessage,
    });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create message: ${errorMessage}` },
      { status: 500 }
    );
  }
}

