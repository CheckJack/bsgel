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

    // Get or create affiliate record
    const affiliate = await getOrCreateAffiliate(user.id, user.email!);

    // Get all referrals for this affiliate
    const referrals = await db.affiliateReferral.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        referredUser: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
        orders: {
          select: {
            id: true,
            total: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Enrich with statistics
    const enrichedReferrals = referrals.map((referral) => {
      const orders = referral.orders || [];
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce(
        (sum, order) => sum + Number(order.total),
        0
      );
      const firstOrder = orders.length > 0 ? orders[orders.length - 1] : null; // Last order is first chronologically

      return {
        id: referral.id,
        status: referral.status,
        referralDate: referral.referralDate,
        createdAt: referral.createdAt,
        firstOrderId: referral.firstOrderId,
        referredUser: referral.referredUser,
        totalOrders,
        totalRevenue,
        firstOrderDate: firstOrder?.createdAt || null,
        lastOrderDate: orders.length > 0 ? orders[0].createdAt : null,
      };
    });

    return NextResponse.json({
      referrals: enrichedReferrals,
      total: enrichedReferrals.length,
    });
  } catch (error: any) {
    console.error("Failed to fetch referrals:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch referrals",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

