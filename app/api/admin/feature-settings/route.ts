import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-logger";

// GET - Get feature settings (public endpoint, but admin can update)
export async function GET(req: Request) {
  try {
    // Fetch both settings in parallel using findMany for better performance
    const settings = await db.systemSettings.findMany({
      where: {
        key: {
          in: ["rewardsEnabled", "affiliateEnabled"],
        },
      },
    });

    // Create a map for quick lookup
    const settingsMap = new Map(settings.map(s => [s.key, s.value === "true"]));

    const response = {
      rewardsEnabled: settingsMap.get("rewardsEnabled") ?? true,
      affiliateEnabled: settingsMap.get("affiliateEnabled") ?? true,
    };

    // Add cache headers for better performance (cache for 30 seconds)
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch feature settings:", error);
    
    // If SystemSettings model doesn't exist yet, return defaults
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      return NextResponse.json({
        rewardsEnabled: true,
        affiliateEnabled: true,
      }, {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch feature settings" },
      { status: 500 }
    );
  }
}

// POST - Update feature settings (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rewardsEnabled, affiliateEnabled } = body;

    if (typeof rewardsEnabled !== "boolean" || typeof affiliateEnabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Update or create rewards setting
    try {
      await db.systemSettings.upsert({
        where: { key: "rewardsEnabled" },
        update: { value: rewardsEnabled.toString() },
        create: {
          key: "rewardsEnabled",
          value: rewardsEnabled.toString(),
          description: "Enable or disable rewards program visibility for customers",
        },
      });
    } catch (upsertError: any) {
      console.error("Error upserting rewardsEnabled:", upsertError);
      throw upsertError;
    }

    // Update or create affiliate setting
    try {
      await db.systemSettings.upsert({
        where: { key: "affiliateEnabled" },
        update: { value: affiliateEnabled.toString() },
        create: {
          key: "affiliateEnabled",
          value: affiliateEnabled.toString(),
          description: "Enable or disable affiliate program visibility for customers",
        },
      });
    } catch (upsertError: any) {
      console.error("Error upserting affiliateEnabled:", upsertError);
      throw upsertError;
    }

    // Log admin action
    await logAdminAction({
      userId: session.user.id,
      actionType: "UPDATE",
      resourceType: "SystemSettings",
      description: `Updated feature settings: Rewards=${rewardsEnabled}, Affiliate=${affiliateEnabled}`,
      details: {
        rewardsEnabled,
        affiliateEnabled,
      },
    });

    return NextResponse.json({
      success: true,
      rewardsEnabled,
      affiliateEnabled,
    });
  } catch (error: any) {
    console.error("Failed to update feature settings:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.substring(0, 500),
    });
    
    // If SystemSettings model doesn't exist yet, return error
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      return NextResponse.json(
        { error: "SystemSettings model not found. Please run database migrations." },
        { status: 500 }
      );
    }
    
    // Return more detailed error message for debugging
    return NextResponse.json(
      { 
        error: "Failed to update feature settings",
        details: error?.message || "Unknown error",
        code: error?.code,
      },
      { status: 500 }
    );
  }
}

