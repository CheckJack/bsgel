import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all coupons
    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
    })

    // Get all notifications with coupon codes to calculate usage stats
    const notifications = await db.notification.findMany({
      where: {
        type: "ORDER",
      },
    })

    // Calculate analytics
    const totalCoupons = coupons.length
    const activeCoupons = coupons.filter((c) => c.isActive).length
    const expiredCoupons = coupons.filter(
      (c) => c.validUntil && new Date(c.validUntil) < new Date()
    ).length
    const totalUsage = coupons.reduce((sum, c) => sum + c.usedCount, 0)

    // Calculate total discount given (estimate)
    let totalDiscountGiven = 0
    notifications.forEach((notification) => {
      const metadata = notification.metadata as any
      if (metadata?.couponCode && metadata?.total) {
        // This is an estimate - we'd need to store actual discount amounts for accuracy
        const coupon = coupons.find((c) => c.code === metadata.couponCode)
        if (coupon) {
          // Rough estimate based on order total and discount type
          const orderTotal = parseFloat(metadata.total) || 0
          if (coupon.discountType === "PERCENTAGE") {
            const discount = (orderTotal * Number(coupon.discountValue)) / 100
            totalDiscountGiven += Math.min(
              discount,
              Number(coupon.maxDiscountAmount || discount)
            )
          } else {
            totalDiscountGiven += Math.min(
              Number(coupon.discountValue),
              orderTotal
            )
          }
        }
      }
    })

    // Get most used coupons
    const mostUsedCoupons = coupons
      .sort((a, b) => b.usedCount - a.usedCount)
      .slice(0, 5)
      .map((c) => ({
        code: c.code,
        usedCount: c.usedCount,
        usageLimit: c.usageLimit,
        usagePercentage: c.usageLimit
          ? (c.usedCount / c.usageLimit) * 100
          : null,
      }))

    // Get coupons by status
    const now = new Date()
    const statusBreakdown = {
      active: coupons.filter(
        (c) =>
          c.isActive &&
          (!c.validFrom || new Date(c.validFrom) <= now) &&
          (!c.validUntil || new Date(c.validUntil) >= now) &&
          (!c.usageLimit || c.usedCount < c.usageLimit)
      ).length,
      inactive: coupons.filter((c) => !c.isActive).length,
      expired: coupons.filter(
        (c) => c.validUntil && new Date(c.validUntil) < now
      ).length,
      scheduled: coupons.filter(
        (c) => c.validFrom && new Date(c.validFrom) > now
      ).length,
      limitReached: coupons.filter(
        (c) => c.usageLimit && c.usedCount >= c.usageLimit
      ).length,
    }

    return NextResponse.json({
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalUsage,
      totalDiscountGiven: totalDiscountGiven.toFixed(2),
      mostUsedCoupons,
      statusBreakdown,
    })
  } catch (error) {
    console.error("Failed to fetch coupon analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupon analytics" },
      { status: 500 }
    )
  }
}

