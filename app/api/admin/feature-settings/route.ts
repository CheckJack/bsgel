import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/admin-logger";
import {
  getMaintenanceMode,
  setMaintenanceMode,
} from "@/lib/maintenance";

// GET - Get feature settings (public endpoint, but admin can update)
export async function GET(req: Request) {
  try {
    const settings = await db.systemSettings.findMany({
      where: {
        key: {
          in: ["rewardsEnabled", "affiliateEnabled", "maintenanceMode"],
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, s.value === "true"]));

    const response = {
      rewardsEnabled: settingsMap.get("rewardsEnabled") ?? true,
      affiliateEnabled: settingsMap.get("affiliateEnabled") ?? true,
      maintenanceMode: settingsMap.get("maintenanceMode") ?? false,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch feature settings:", error);

    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      return NextResponse.json(
        {
          rewardsEnabled: true,
          affiliateEnabled: true,
          maintenanceMode: false,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        }
      );
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
    const { rewardsEnabled, affiliateEnabled, maintenanceMode } = body;

    if (
      typeof rewardsEnabled !== "boolean" ||
      typeof affiliateEnabled !== "boolean" ||
      typeof maintenanceMode !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

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

    await setMaintenanceMode(maintenanceMode);

    await logAdminAction({
      userId: session.user.id,
      actionType: "UPDATE",
      resourceType: "SystemSettings",
      description: `Updated feature settings: Rewards=${rewardsEnabled}, Affiliate=${affiliateEnabled}, Maintenance=${maintenanceMode}`,
      details: {
        rewardsEnabled,
        affiliateEnabled,
        maintenanceMode,
      },
    });

    // Confirm persisted value (respects MAINTENANCE_FORCE_OFF)
    const effectiveMaintenance = await getMaintenanceMode();

    return NextResponse.json({
      success: true,
      rewardsEnabled,
      affiliateEnabled,
      maintenanceMode: effectiveMaintenance,
    });
  } catch (error: any) {
    console.error("Failed to update feature settings:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.substring(0, 500),
    });

    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      return NextResponse.json(
        { error: "SystemSettings model not found. Please run database migrations." },
        { status: 500 }
      );
    }

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
