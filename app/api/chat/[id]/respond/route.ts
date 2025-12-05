import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT - Admin responds to a message
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can respond to messages" },
        { status: 403 }
      );
    }

    const { adminResponse } = await req.json();

    if (!adminResponse || typeof adminResponse !== "string" || adminResponse.trim().length === 0) {
      return NextResponse.json(
        { error: "Response message is required" },
        { status: 400 }
      );
    }

    const message = await db.chatMessage.findUnique({
      where: { id: params.id },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    const updatedMessage = await db.chatMessage.update({
      where: { id: params.id },
      data: {
        adminResponse: adminResponse.trim(),
        readByAdmin: true,
        readAt: new Date(),
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

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Failed to respond to message:", error);
    return NextResponse.json(
      { error: "Failed to respond to message" },
      { status: 500 }
    );
  }
}

