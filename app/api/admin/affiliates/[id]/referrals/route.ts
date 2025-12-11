import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const referrals = await db.affiliateReferral.findMany({
      where: { affiliateId: params.id },
      include: {
        referredUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get order counts for each referral
    const referralsWithOrders = await Promise.all(
      referrals.map(async (referral) => {
        const orderCount = await db.order.count({
          where: { affiliateReferralId: referral.id },
        });

        const totalSpent = await db.order.aggregate({
          where: {
            affiliateReferralId: referral.id,
            status: { not: "CANCELLED" },
          },
          _sum: { total: true },
        });

        return {
          ...referral,
          orderCount,
          totalSpent: Number(totalSpent._sum.total || 0),
        };
      })
    );

    return NextResponse.json(referralsWithOrders);
  } catch (error) {
    console.error("Failed to fetch referrals:", error);
    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}

