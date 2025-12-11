import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getOrCreateAffiliate } from "@/lib/affiliate"
import { ReferralStatus } from "@prisma/client"
import { getTierBenefits } from "@/lib/affiliate-tiers"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has confirmed certification
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        pointsBalance: true,
        certification: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get or create affiliate record (no certification requirement)
    const affiliate = await getOrCreateAffiliate(user.id, user.email!)

    // Get affiliate stats
    const totalReferrals = await db.affiliateReferral.count({
      where: { affiliateId: affiliate.id },
    })

    const activeReferrals = await db.affiliateReferral.count({
      where: {
        affiliateId: affiliate.id,
        status: ReferralStatus.ACTIVE,
      },
    })

    // Get points earned this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const pointsThisMonth = await db.pointsTransaction.aggregate({
      where: {
        userId: user.id,
        amount: { gt: 0 },
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    })

    // Get lifetime points earned
    const lifetimePoints = await db.pointsTransaction.aggregate({
      where: {
        userId: user.id,
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    })

    const affiliateLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/?ref=${affiliate.affiliateCode}`

    // Calculate commission rate dynamically from points configuration
    let commissionRate = 0
    try {
      const now = new Date()
      
      // Get active configurations for referral orders
      const firstOrderConfig = await db.pointsConfiguration.findFirst({
        where: {
          actionType: "REFERRAL_FIRST_ORDER",
          isActive: true,
          validFrom: { lte: now },
          OR: [
            { validUntil: null },
            { validUntil: { gte: now } },
          ],
        },
        orderBy: { createdAt: "desc" },
      })

      const repeatOrderConfig = await db.pointsConfiguration.findFirst({
        where: {
          actionType: "REFERRAL_REPEAT_ORDER",
          isActive: true,
          validFrom: { lte: now },
          OR: [
            { validUntil: null },
            { validUntil: { gte: now } },
          ],
        },
        orderBy: { createdAt: "desc" },
      })

      const rates: number[] = []

      // Calculate rate for first order config
      if (firstOrderConfig) {
        if (firstOrderConfig.pointsAmount !== null) {
          // Fixed points - calculate as percentage of a representative order value
          // Use 100€ as representative order value, or minOrderValue if set
          const repOrderValue = firstOrderConfig.minOrderValue 
            ? Number(firstOrderConfig.minOrderValue) 
            : 100
          const points = firstOrderConfig.pointsAmount
          const cappedPoints = firstOrderConfig.maxPointsPerTransaction
            ? Math.min(points, firstOrderConfig.maxPointsPerTransaction)
            : points
          // Calculate percentage: (points / orderValue) * 100
          if (repOrderValue > 0) {
            rates.push((cappedPoints / repOrderValue) * 100)
          }
        } else if (firstOrderConfig.tieredConfig) {
          // Tiered config - use middle tier or average
          const tieredConfig = firstOrderConfig.tieredConfig as any
          if (tieredConfig.tiers && Array.isArray(tieredConfig.tiers) && tieredConfig.tiers.length > 0) {
            // Use the middle tier or average of all tiers
            const middleTier = tieredConfig.tiers[Math.floor(tieredConfig.tiers.length / 2)]
            if (middleTier && middleTier.minOrderValue > 0) {
              const points = middleTier.points
              const cappedPoints = firstOrderConfig.maxPointsPerTransaction
                ? Math.min(points, firstOrderConfig.maxPointsPerTransaction)
                : points
              rates.push((cappedPoints / middleTier.minOrderValue) * 100)
            }
          }
        }
      }

      // Calculate rate for repeat order config
      if (repeatOrderConfig) {
        if (repeatOrderConfig.pointsAmount !== null) {
          const repOrderValue = repeatOrderConfig.minOrderValue 
            ? Number(repeatOrderConfig.minOrderValue) 
            : 100
          const points = repeatOrderConfig.pointsAmount
          const cappedPoints = repeatOrderConfig.maxPointsPerTransaction
            ? Math.min(points, repeatOrderConfig.maxPointsPerTransaction)
            : points
          if (repOrderValue > 0) {
            rates.push((cappedPoints / repOrderValue) * 100)
          }
        } else if (repeatOrderConfig.tieredConfig) {
          const tieredConfig = repeatOrderConfig.tieredConfig as any
          if (tieredConfig.tiers && Array.isArray(tieredConfig.tiers) && tieredConfig.tiers.length > 0) {
            const middleTier = tieredConfig.tiers[Math.floor(tieredConfig.tiers.length / 2)]
            if (middleTier && middleTier.minOrderValue > 0) {
              const points = middleTier.points
              const cappedPoints = repeatOrderConfig.maxPointsPerTransaction
                ? Math.min(points, repeatOrderConfig.maxPointsPerTransaction)
                : points
              rates.push((cappedPoints / middleTier.minOrderValue) * 100)
            }
          }
        }
      }

      // Calculate average commission rate
      if (rates.length > 0) {
        commissionRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
        // Round to 2 decimal places
        commissionRate = Math.round(commissionRate * 100) / 100
      }
    } catch (error) {
      console.error("Failed to calculate commission rate:", error)
      // Default to 0 if calculation fails
      commissionRate = 0
    }

    // Get tier benefits
    const tierBenefits = getTierBenefits(affiliate.tier)

    const stats = {
      totalReferrals,
      activeReferrals,
      totalEarnings: lifetimePoints._sum.amount || 0,
      pendingEarnings: 0, // Points are awarded immediately, so no pending
      pointsBalance: user.pointsBalance || 0,
      pointsThisMonth: pointsThisMonth._sum.amount || 0,
      affiliateCode: affiliate.affiliateCode,
      affiliateLink,
      commissionRate,
      tier: affiliate.tier,
      tierBenefits,
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error("Failed to fetch affiliate data:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    return NextResponse.json(
      { 
        error: "Failed to fetch affiliate data",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

