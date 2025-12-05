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

    const messages = await db.chatMessage.findMany({
      where: isAdmin ? {} : { userId: session.user.id },
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
    });

    return NextResponse.json(messages);
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

