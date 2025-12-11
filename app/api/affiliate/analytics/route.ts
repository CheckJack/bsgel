import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateAffiliate } from "@/lib/affiliate";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const affiliate = await getOrCreateAffiliate(user.id, user.email!);

    if (!affiliate || !affiliate.id) {
      return NextResponse.json(
        { error: "Failed to create or retrieve affiliate record" },
        { status: 500 }
      );
    }

    // Get click statistics
    const totalClicks = await db.affiliateLinkClick.count({
      where: { affiliateId: affiliate.id },
    }).catch(() => 0);

    const convertedClicks = await db.affiliateLinkClick.count({
      where: {
        affiliateId: affiliate.id,
        converted: true,
      },
    }).catch(() => 0);

    const conversionRate =
      totalClicks > 0 ? (convertedClicks / totalClicks) * 100 : 0;

    // Get clicks over time (grouped by day)
    const clicks = await db.affiliateLinkClick.findMany({
      where: { affiliateId: affiliate.id },
      select: {
        clickedAt: true,
        converted: true,
      },
      orderBy: { clickedAt: "asc" },
    }).catch(() => []);

    // Group by day
    const clicksByDay: Record<string, { total: number; converted: number }> = {};
    clicks.forEach((click) => {
      const date = new Date(click.clickedAt);
      const key = date.toISOString().split("T")[0];

      if (!clicksByDay[key]) {
        clicksByDay[key] = { total: 0, converted: 0 };
      }
      clicksByDay[key].total += 1;
      if (click.converted) {
        clicksByDay[key].converted += 1;
      }
    });

    const clicksOverTime = Object.entries(clicksByDay)
      .map(([date, data]) => ({
        date,
        total: data.total,
        converted: data.converted,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get referrals count
    const totalReferrals = await db.affiliateReferral.count({
      where: { affiliateId: affiliate.id },
    }).catch(() => 0);

    // Calculate conversion funnel
    const activeReferrals = await db.affiliateReferral.count({
      where: {
        affiliateId: affiliate.id,
        status: "ACTIVE",
      },
    }).catch(() => 0);

    const funnel = {
      clicks: totalClicks,
      registrations: convertedClicks,
      referrals: totalReferrals,
      activeReferrals,
    };

    return NextResponse.json({
      totalClicks,
      convertedClicks,
      conversionRate: Math.round(conversionRate * 100) / 100,
      clicksOverTime,
      funnel,
    });
  } catch (error: any) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

