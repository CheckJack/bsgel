import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { blogIds } = body;

    if (!Array.isArray(blogIds) || blogIds.length === 0) {
      return NextResponse.json(
        { error: "Blog IDs array is required" },
        { status: 400 }
      );
    }

    // Delete blogs
    const result = await db.blog.deleteMany({
      where: {
        id: { in: blogIds },
      },
    });

    return NextResponse.json({
      message: "Blogs deleted successfully",
      count: result.count,
    });
  } catch (error: any) {
    console.error("Failed to bulk delete blogs:", error);
    return NextResponse.json(
      {
        error: "Failed to delete blogs",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { blogIds, status } = body;

    if (!Array.isArray(blogIds) || blogIds.length === 0) {
      return NextResponse.json(
        { error: "Blog IDs array is required" },
        { status: 400 }
      );
    }

    if (!status || !["DRAFT", "PUBLISHED"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status (DRAFT or PUBLISHED) is required" },
        { status: 400 }
      );
    }

    const updateData: any = { status };

    // Set publishedAt when status changes to PUBLISHED
    if (status === "PUBLISHED") {
      updateData.publishedAt = new Date();
    }

    // Update blogs
    const result = await db.blog.updateMany({
      where: {
        id: { in: blogIds },
      },
      data: updateData,
    });

    return NextResponse.json({
      message: "Blogs updated successfully",
      count: result.count,
    });
  } catch (error: any) {
    console.error("Failed to bulk update blogs:", error);
    return NextResponse.json(
      {
        error: "Failed to update blogs",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

