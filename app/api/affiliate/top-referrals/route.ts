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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const affiliate = await getOrCreateAffiliate(user.id, user.email!);

    // Get all referrals with their orders
    const referrals = await db.affiliateReferral.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        referredUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        orders: {
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });

    // Calculate stats for each referral
    const referralStats = referrals.map((referral) => {
      const orders = referral.orders || [];
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce(
        (sum, order) => sum + Number(order.total),
        0
      );

      return {
        id: referral.id,
        referredUser: referral.referredUser,
        totalOrders,
        totalRevenue,
        status: referral.status,
        referralDate: referral.referralDate,
      };
    });

    // Sort by total revenue (descending) and limit
    const topReferrals = referralStats
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return NextResponse.json({ referrals: topReferrals });
  } catch (error: any) {
    console.error("Failed to fetch top referrals:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch top referrals",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

