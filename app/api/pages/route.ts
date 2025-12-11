import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAdminAction, extractRequestInfo } from "@/lib/admin-logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Get total count for pagination
    const total = await db.page.count({ where });

    // Fetch pages
    const pages = await db.page.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      pages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch pages:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch pages",
        pages: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, content, template, status, sections, seoTitle, seoDescription, seoUrl, slug } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Page name is required" }, { status: 400 });
    }

    // Generate slug if not provided
    const pageSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const page = await db.page.create({
      data: {
        name: name.trim(),
        slug: pageSlug,
        description: description || null,
        content: content || null,
        template: template || "Default",
        status: status || "DRAFT",
        sections: sections || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoUrl: seoUrl || null,
      },
    });

    // Log admin action
    const { ipAddress, userAgent } = extractRequestInfo(req);
    await logAdminAction({
      userId: session.user.id!,
      actionType: "CREATE" as any,
      resourceType: "Page",
      resourceId: page.id,
      description: `Created page "${page.name}"`,
      details: {
        after: page,
      },
      ipAddress,
      userAgent,
      metadata: {
        url: req.url,
        method: "POST",
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create page:", error);

    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Page with this slug already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}

