import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAdminAction, extractRequestInfo, createChangeDetails } from "@/lib/admin-logger";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const page = await db.page.findUnique({
      where: { id: params.id },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error: any) {
    console.error("Failed to fetch page:", error);
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, content, template, status, sections, seoTitle, seoDescription, seoUrl, slug } = body;

    // Check if page exists
    const existingPage = await db.page.findUnique({
      where: { id: params.id },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Store page before update for logging
    const pageBefore = { ...existingPage };

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description || null;
    if (content !== undefined) updateData.content = content || null;
    if (template !== undefined) updateData.template = template;
    if (status !== undefined) updateData.status = status;
    if (sections !== undefined) updateData.sections = sections;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle || null;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription || null;
    if (seoUrl !== undefined) updateData.seoUrl = seoUrl || null;
    if (slug !== undefined) {
      updateData.slug = slug || name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || existingPage.slug;
    }

    const updatedPage = await db.page.update({
      where: { id: params.id },
      data: updateData,
    });

    // Log admin action
    const { ipAddress, userAgent } = extractRequestInfo(request);
    await logAdminAction({
      userId: session.user.id!,
      actionType: "UPDATE" as any,
      resourceType: "Page",
      resourceId: params.id,
      description: `Updated page "${updatedPage.name}"`,
      details: createChangeDetails(pageBefore, updatedPage),
      ipAddress,
      userAgent,
      metadata: {
        url: request.url,
        method: "PATCH",
      },
    });

    return NextResponse.json(updatedPage);
  } catch (error: any) {
    console.error("Failed to update page:", error);

    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Page with this slug already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const page = await db.page.findUnique({
      where: { id: params.id },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    await db.page.delete({
      where: { id: params.id },
    });

    // Log admin action
    const { ipAddress, userAgent } = extractRequestInfo(request);
    await logAdminAction({
      userId: session.user.id!,
      actionType: "DELETE" as any,
      resourceType: "Page",
      resourceId: params.id,
      description: `Deleted page "${page.name}"`,
      details: {
        before: page,
      },
      ipAddress,
      userAgent,
      metadata: {
        url: request.url,
        method: "DELETE",
      },
    });

    return NextResponse.json({ message: "Page deleted successfully" });
  } catch (error: any) {
    console.error("Failed to delete page:", error);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}

