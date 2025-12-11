import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { deductPoints } from "@/lib/points";
import { checkFirstRedemptionMilestone } from "@/lib/notifications/affiliate-milestones";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rewardId } = await req.json();

    if (!rewardId) {
      return NextResponse.json(
        { error: "Reward ID is required" },
        { status: 400 }
      );
    }

    // Get reward
    const reward = await db.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      return NextResponse.json(
        { error: "Reward not found" },
        { status: 404 }
      );
    }

    // Check if reward is active and valid
    const now = new Date();
    if (!reward.isActive) {
      return NextResponse.json(
        { error: "Reward is not available" },
        { status: 400 }
      );
    }

    if (reward.validFrom > now || (reward.validUntil && reward.validUntil < now)) {
      return NextResponse.json(
        { error: "Reward is not currently valid" },
        { status: 400 }
      );
    }

    // Check stock
    if (reward.stock !== null && reward.redeemedCount >= reward.stock) {
      return NextResponse.json(
        { error: "Reward is out of stock" },
        { status: 400 }
      );
    }

    // Check user's points balance
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { pointsBalance: true },
    });

    if (!user || (user.pointsBalance || 0) < reward.pointsCost) {
      return NextResponse.json(
        { error: "Insufficient points balance" },
        { status: 400 }
      );
    }

    // Generate unique coupon code
    const couponCode = `REW${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create coupon in transaction - ALL operations must be inside the transaction
    const result = await db.$transaction(async (tx) => {
      // Get current user balance INSIDE transaction
      const user = await tx.user.findUnique({
        where: { id: session.user.id! },
        select: { pointsBalance: true },
      });

      if (!user || (user.pointsBalance || 0) < reward.pointsCost) {
        throw new Error("Insufficient points balance");
      }

      const balanceBefore = user.pointsBalance || 0;
      const balanceAfter = balanceBefore - reward.pointsCost;

      // Deduct points INSIDE transaction
      await tx.pointsTransaction.create({
        data: {
          userId: session.user.id!,
          amount: -reward.pointsCost,
          type: "REDEMPTION",
          referenceId: rewardId,
          description: `Redeemed reward: ${reward.name}`,
          balanceBefore,
          balanceAfter,
        },
      });

      // Update user balance INSIDE transaction
      await tx.user.update({
        where: { id: session.user.id! },
        data: { pointsBalance: balanceAfter },
      });

      // Note: Affiliate stats will be recalculated when needed
      // We skip updating affiliate.currentPointsBalance here to avoid schema mismatch issues
      // The user's pointsBalance is already updated above, which is the source of truth

      // Create coupon
      const coupon = await tx.coupon.create({
        data: {
          code: couponCode,
          description: `Reward redemption: ${reward.name}`,
          discountType: reward.discountType,
          discountValue: reward.discountValue,
          minPurchaseAmount: reward.minPurchaseAmount,
          maxDiscountAmount: reward.maxDiscountAmount,
          source: "REDEMPTION",
          validFrom: reward.validFrom,
          validUntil: reward.validUntil || null,
        },
      });

      console.log(`Created coupon: ${coupon.id} with code: ${couponCode}`);

      // Create redemption record
      // Set status to ACTIVE if coupon is valid now, otherwise PENDING
      const now = new Date();
      const isCouponValidNow = 
        (!coupon.validFrom || now >= coupon.validFrom) &&
        (!coupon.validUntil || now <= coupon.validUntil) &&
        coupon.isActive;
      
      const redemption = await tx.pointsRedemption.create({
        data: {
          userId: session.user.id!,
          rewardId: reward.id,
          pointsSpent: reward.pointsCost,
          couponCode,
          couponId: coupon.id,
          status: isCouponValidNow ? "ACTIVE" : "PENDING",
        },
      });

      console.log(`Created redemption: ${redemption.id} for user ${session.user.id} with couponId: ${coupon.id}`);

      // Update reward redemption count
      await tx.reward.update({
        where: { id: reward.id },
        data: {
          redeemedCount: { increment: 1 },
        },
      });

      return { coupon, redemption };
    });

    // Check for first redemption milestone
    const affiliate = await db.affiliate.findUnique({
      where: { userId: session.user.id! },
      select: { id: true },
    });
    
    if (affiliate) {
      await checkFirstRedemptionMilestone(session.user.id!, affiliate.id);
    }

    console.log("Redemption successful:", {
      userId: session.user.id,
      couponCode,
      couponId: result.coupon.id,
      redemptionId: result.redemption.id,
    });

    return NextResponse.json({
      success: true,
      couponCode,
      coupon: result.coupon,
      redemption: result.redemption,
    });
  } catch (error) {
    console.error("Failed to redeem reward:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to redeem reward" },
      { status: 500 }
    );
  }
}

