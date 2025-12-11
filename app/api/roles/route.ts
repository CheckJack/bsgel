import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction, extractRequestInfo } from "@/lib/admin-logger";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const roles = await db.role.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(roles);
  } catch (error: any) {
    console.error("Failed to fetch roles:", error);
    
    // If Role model doesn't exist yet (migration not run), return empty array
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, permissions } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    const role = await db.role.create({
      data: {
        name: name.trim(),
        permissions: permissions || {},
      },
    });

    // Log admin action
    const { ipAddress, userAgent } = extractRequestInfo(req);
    await logAdminAction({
      userId: session.user.id!,
      actionType: "CREATE" as any,
      resourceType: "Role",
      resourceId: role.id,
      description: `Created role "${role.name}"`,
      details: {
        after: role,
      },
      ipAddress,
      userAgent,
      metadata: {
        url: req.url,
        method: "POST",
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create role:", error);
    
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Role with this name already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}

