import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // Filter by status: active, used, expired

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    // Get all redemptions for the user
    console.log(`Querying redemptions for user ${session.user.id} with where:`, JSON.stringify(where, null, 2));
    
    const redemptions = await db.pointsRedemption.findMany({
      where,
      include: {
        reward: {
          select: {
            id: true,
            name: true,
            description: true,
            discountType: true,
            discountValue: true,
          },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
            minPurchaseAmount: true,
            maxDiscountAmount: true,
            validFrom: true,
            validUntil: true,
            isActive: true,
            usedCount: true,
            usageLimit: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${redemptions.length} redemptions for user ${session.user.id}`);
    console.log("Redemptions details:", redemptions.map(r => ({
      id: r.id,
      couponCode: r.couponCode,
      couponId: r.couponId,
      hasCoupon: !!r.coupon,
      couponCodeFromRelation: r.coupon?.code,
      rewardName: r.reward?.name,
      status: r.status,
      createdAt: r.createdAt,
    })));

    // Enrich with actual status based on coupon usage and dates
    const now = new Date();
    const enrichedRedemptions = redemptions
      .filter((redemption) => {
        // CRITICAL: If coupon is null, log it and skip this redemption
        if (!redemption.coupon) {
          console.error(`WARNING: Redemption ${redemption.id} has no coupon! couponId: ${redemption.couponId}`);
          return false;
        }
        return true;
      })
      .map((redemption) => {
        const coupon = redemption.coupon!; // We know it's not null due to filter above
        let actualStatus = redemption.status;

        // Check if coupon has been used
        if (coupon.usedCount > 0) {
          actualStatus = "USED";
        } else if (coupon.validUntil && new Date(coupon.validUntil) < now) {
          actualStatus = "EXPIRED";
        } else if (!coupon.isActive) {
          actualStatus = "EXPIRED";
        } else if (coupon.validFrom && new Date(coupon.validFrom) > now) {
          actualStatus = "PENDING";
        } else {
          actualStatus = "ACTIVE";
        }

        return {
          id: redemption.id,
          couponCode: redemption.couponCode,
          pointsSpent: redemption.pointsSpent,
          status: actualStatus,
          createdAt: redemption.createdAt,
          updatedAt: redemption.updatedAt,
          reward: redemption.reward,
          coupon: {
            ...coupon,
            isValid: actualStatus === "ACTIVE",
            isExpired: actualStatus === "EXPIRED",
            isUsed: actualStatus === "USED",
          },
        };
      });

    console.log(`Returning ${enrichedRedemptions.length} valid redemptions (from ${redemptions.length} total redemptions found)`);

    return NextResponse.json({
      redemptions: enrichedRedemptions,
      total: enrichedRedemptions.length,
    });
  } catch (error: any) {
    console.error("Failed to fetch user coupons:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch coupons",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

