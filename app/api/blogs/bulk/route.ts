import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { applyPublishState, isValidBlogStatus } from "@/lib/blog";

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAdmin();

    if (!session) {
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

    const result = await db.blog.deleteMany({
      where: {
        id: { in: blogIds },
      },
    });

    return NextResponse.json({
      message: "Blogs deleted successfully",
      count: result.count,
    });
  } catch (error: unknown) {
    console.error("Failed to bulk delete blogs:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to delete blogs",
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAdmin();

    if (!session) {
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

    if (!status || !isValidBlogStatus(status)) {
      return NextResponse.json(
        { error: "Valid status (DRAFT or PUBLISHED) is required" },
        { status: 400 }
      );
    }

    const blogs = await db.blog.findMany({
      where: { id: { in: blogIds } },
      select: { id: true, publishedAt: true },
    });

    let updatedCount = 0;

    for (const blog of blogs) {
      const publishState = applyPublishState(status, blog.publishedAt)

      await db.blog.update({
        where: { id: blog.id },
        data: {
          status: publishState.status,
          publishedAt: publishState.publishedAt,
          assignedReviewerId: null,
        },
      })

      updatedCount += 1
    }

    return NextResponse.json({
      message: "Blogs updated successfully",
      count: updatedCount,
    });
  } catch (error: unknown) {
    console.error("Failed to bulk update blogs:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to update blogs",
        details: message,
      },
      { status: 500 }
    );
  }
}
