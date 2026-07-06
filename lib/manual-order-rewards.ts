import { db } from "@/lib/db"
import { getReferralByUserId, activateReferral } from "@/lib/affiliate"
import { calculatePoints, awardPoints } from "@/lib/points"

/**
 * Run coupon usage + referral + own-purchase points after an MBWay / bank transfer
 * order is confirmed by an admin (payment was deferred).
 */
export async function applyRewardsAfterManualPaymentConfirmed(options: {
  userId: string
  orderId: string
  total: number
  appliedCouponCode: string | null
}) {
  const { userId, orderId, total, appliedCouponCode } = options

  if (appliedCouponCode) {
    try {
      await db.coupon.updateMany({
        where: { code: appliedCouponCode },
        data: { usedCount: { increment: 1 } },
      })
      await db.pointsRedemption.updateMany({
        where: { couponCode: appliedCouponCode.toUpperCase().trim() },
        data: { status: "USED" },
      })
    } catch (e) {
      console.error("Failed to update coupon after manual payment confirm:", e)
    }
  }

  const referral = await getReferralByUserId(userId)
  if (referral) {
    try {
      const currentReferral = await db.affiliateReferral.findUnique({
        where: { id: referral.id },
      })

      if (currentReferral?.status === "PENDING") {
        await activateReferral(referral.id, orderId)
        const firstOrderPoints = await calculatePoints("REFERRAL_FIRST_ORDER", total)
        if (firstOrderPoints > 0) {
          const affiliate = await db.affiliate.findUnique({ where: { id: referral.affiliateId } })
          if (affiliate) {
            await awardPoints(
              affiliate.userId,
              firstOrderPoints,
              "AFFILIATE_PURCHASE",
              orderId,
              `Referral first order: ${total}€`
            )
          }
        }
      } else if (currentReferral?.status === "ACTIVE") {
        const repeatOrderPoints = await calculatePoints("REFERRAL_REPEAT_ORDER", total)
        if (repeatOrderPoints > 0) {
          const affiliate = await db.affiliate.findUnique({ where: { id: referral.affiliateId } })
          if (affiliate) {
            await awardPoints(
              affiliate.userId,
              repeatOrderPoints,
              "AFFILIATE_PURCHASE",
              orderId,
              `Referral repeat order: ${total}€`
            )
          }
        }
      }
    } catch (e) {
      console.error("Referral rewards after manual confirm:", e)
    }
  }

  try {
    const ownPurchasePoints = await calculatePoints("OWN_PURCHASE", total)
    if (ownPurchasePoints > 0) {
      await awardPoints(
        userId,
        ownPurchasePoints,
        "AFFILIATE_PURCHASE",
        orderId,
        `Purchase points: ${total}€`
      )
    }
  } catch (e) {
    console.error("Own purchase points after manual confirm:", e)
  }
}
