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

    // Get all referrals grouped by month
    const referrals = await db.affiliateReferral.findMany({
      where: { affiliateId: affiliate.id },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by month
    const stats: Record<string, { total: number; active: number }> = {};

    referrals.forEach((referral) => {
      const date = new Date(referral.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!stats[key]) {
        stats[key] = { total: 0, active: 0 };
      }
      stats[key].total += 1;
      if (referral.status === "ACTIVE") {
        stats[key].active += 1;
      }
    });

    // Convert to array format
    const result = Object.entries(stats)
      .map(([month, data]) => ({
        month,
        total: data.total,
        active: data.active,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({ stats: result });
  } catch (error: any) {
    console.error("Failed to fetch referrals stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch referrals stats",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

