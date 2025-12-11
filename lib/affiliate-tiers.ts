import { db } from "@/lib/db";
import { AffiliateTier } from "@prisma/client";

interface TierThresholds {
  totalReferrals: number;
  totalPointsEarned: number;
  activeReferrals: number;
}

const TIER_THRESHOLDS: Record<AffiliateTier, TierThresholds> = {
  BRONZE: {
    totalReferrals: 0,
    totalPointsEarned: 0,
    activeReferrals: 0,
  },
  SILVER: {
    totalReferrals: 10,
    totalPointsEarned: 500,
    activeReferrals: 5,
  },
  GOLD: {
    totalReferrals: 50,
    totalPointsEarned: 2500,
    activeReferrals: 25,
  },
  PLATINUM: {
    totalReferrals: 200,
    totalPointsEarned: 10000,
    activeReferrals: 100,
  },
};

/**
 * Calculate affiliate tier based on current stats
 */
export function calculateTier(stats: {
  totalReferrals: number;
  totalPointsEarned: number;
  activeReferrals: number;
}): AffiliateTier {
  // Check from highest to lowest tier
  if (
    stats.totalReferrals >= TIER_THRESHOLDS.PLATINUM.totalReferrals &&
    stats.totalPointsEarned >= TIER_THRESHOLDS.PLATINUM.totalPointsEarned &&
    stats.activeReferrals >= TIER_THRESHOLDS.PLATINUM.activeReferrals
  ) {
    return "PLATINUM";
  }

  if (
    stats.totalReferrals >= TIER_THRESHOLDS.GOLD.totalReferrals &&
    stats.totalPointsEarned >= TIER_THRESHOLDS.GOLD.totalPointsEarned &&
    stats.activeReferrals >= TIER_THRESHOLDS.GOLD.activeReferrals
  ) {
    return "GOLD";
  }

  if (
    stats.totalReferrals >= TIER_THRESHOLDS.SILVER.totalReferrals &&
    stats.totalPointsEarned >= TIER_THRESHOLDS.SILVER.totalPointsEarned &&
    stats.activeReferrals >= TIER_THRESHOLDS.SILVER.activeReferrals
  ) {
    return "SILVER";
  }

  return "BRONZE";
}

/**
 * Auto-promote affiliate to appropriate tier
 */
export async function autoPromoteAffiliate(affiliateId: string): Promise<void> {
  try {
    const affiliate = await db.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        referrals: {
          where: { status: "ACTIVE" },
        },
      },
    });

    if (!affiliate) return;

    const stats = {
      totalReferrals: affiliate.totalReferrals,
      totalPointsEarned: affiliate.totalPointsEarned,
      activeReferrals: affiliate.activeReferrals,
    };

    const calculatedTier = calculateTier(stats);

    // Only update if tier changed
    if (calculatedTier !== affiliate.tier) {
      await db.affiliate.update({
        where: { id: affiliateId },
        data: {
          tier: calculatedTier,
          tierUpdatedAt: new Date(),
        },
      });

      // Create notification for tier upgrade
      await db.notification.create({
        data: {
          type: "SYSTEM",
          title: `🎉 Tier Upgrade to ${calculatedTier}!`,
          message: `Congratulations! You've been promoted to ${calculatedTier} tier. Keep up the great work!`,
          userId: affiliate.userId,
          metadata: {
            tier: calculatedTier,
            previousTier: affiliate.tier,
          },
        },
      });
    }
  } catch (error) {
    console.error("Failed to auto-promote affiliate:", error);
  }
}

/**
 * Get tier benefits description
 */
export function getTierBenefits(tier: AffiliateTier): {
  commissionBonus: number;
  description: string;
} {
  const benefits: Record<AffiliateTier, { commissionBonus: number; description: string }> = {
    BRONZE: {
      commissionBonus: 0,
      description: "Standard commission rates, access to all rewards",
    },
    SILVER: {
      commissionBonus: 5,
      description: "5% commission bonus, priority support, exclusive rewards",
    },
    GOLD: {
      commissionBonus: 10,
      description: "10% commission bonus, dedicated support, premium rewards",
    },
    PLATINUM: {
      commissionBonus: 20,
      description: "20% commission bonus, VIP support, exclusive rewards, early access",
    },
  };

  return benefits[tier];
}

