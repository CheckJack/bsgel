import { db } from "@/lib/db";
import { PointsConfigurationActionType } from "@prisma/client";

export interface TieredConfigTier {
  minOrderValue: number;
  maxOrderValue: number | null; // null means infinity
  points: number;
}

export interface TieredConfig {
  tiers: TieredConfigTier[];
}

/**
 * Calculate points to award based on configuration and order value
 */
export async function calculatePoints(
  actionType: PointsConfigurationActionType,
  orderValue: number | null = null
): Promise<number> {
  // Get active configuration for this action type
  const now = new Date();
  const config = await db.pointsConfiguration.findFirst({
    where: {
      actionType,
      isActive: true,
      validFrom: { lte: now },
      OR: [
        { validUntil: null },
        { validUntil: { gte: now } },
      ],
    },
    orderBy: { createdAt: "desc" }, // Get most recent config
  });

  if (!config) {
    console.warn(`⚠️ No active points configuration found for actionType: ${actionType}`);
    return 0; // No active configuration
  }

  // Check minimum order value requirement
  if (config.minOrderValue && orderValue !== null) {
    if (orderValue < Number(config.minOrderValue)) {
      return 0; // Order value too low
    }
  }

  // If tiered config exists, use it
  if (config.tieredConfig) {
    const tieredConfig = config.tieredConfig as TieredConfig;
    if (orderValue !== null && tieredConfig.tiers) {
      // Find matching tier
      for (const tier of tieredConfig.tiers) {
        if (
          orderValue >= tier.minOrderValue &&
          (tier.maxOrderValue === null || orderValue <= tier.maxOrderValue)
        ) {
          let points = tier.points;
          
          // Apply max cap if configured
          if (config.maxPointsPerTransaction) {
            points = Math.min(points, config.maxPointsPerTransaction);
          }
          
          return points;
        }
      }
    }
    return 0; // No matching tier
  }

  // Use fixed points amount
  if (config.pointsAmount !== null) {
    let points = config.pointsAmount;
    
    // Apply max cap if configured
    if (config.maxPointsPerTransaction) {
      points = Math.min(points, config.maxPointsPerTransaction);
    }
    
    return points;
  }

  return 0;
}

/**
 * Award points to a user and update their balance
 */
export async function awardPoints(
  userId: string,
  amount: number,
  type: string,
  referenceId: string | null = null,
  description: string | null = null
): Promise<void> {
  if (amount <= 0) {
    throw new Error("Points amount must be positive");
  }

  // Get current user balance
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { pointsBalance: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const balanceBefore = user.pointsBalance || 0;
  const balanceAfter = balanceBefore + amount;

  // Create transaction record
  await db.pointsTransaction.create({
    data: {
      userId,
      amount,
      type: type as any,
      referenceId,
      description,
      balanceBefore,
      balanceAfter,
    },
  });

  // Update user balance
  await db.user.update({
    where: { id: userId },
    data: { pointsBalance: balanceAfter },
  });

  // Update affiliate stats if applicable
  const affiliate = await db.affiliate.findUnique({
    where: { userId },
  });

  if (affiliate) {
    await db.affiliate.update({
      where: { userId },
      data: {
        totalPointsEarned: { increment: amount },
        currentPointsBalance: balanceAfter,
      },
    });
  }
}

/**
 * Deduct points from a user and update their balance
 */
export async function deductPoints(
  userId: string,
  amount: number,
  type: string,
  referenceId: string | null = null,
  description: string | null = null
): Promise<void> {
  if (amount <= 0) {
    throw new Error("Points amount must be positive");
  }

  // Get current user balance
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { pointsBalance: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const balanceBefore = user.pointsBalance || 0;

  if (balanceBefore < amount) {
    throw new Error("Insufficient points balance");
  }

  const balanceAfter = balanceBefore - amount;

  // Create transaction record
  await db.pointsTransaction.create({
    data: {
      userId,
      amount: -amount, // Negative for deduction
      type: type as any,
      referenceId,
      description,
      balanceBefore,
      balanceAfter,
    },
  });

  // Update user balance
  await db.user.update({
    where: { id: userId },
    data: { pointsBalance: balanceAfter },
  });

  // Update affiliate stats if applicable
  const affiliate = await db.affiliate.findUnique({
    where: { userId },
  });

  if (affiliate) {
    await db.affiliate.update({
      where: { userId },
      data: {
        currentPointsBalance: balanceAfter,
      },
    });
  }
}

/**
 * Manually adjust points (for admin actions)
 */
export async function adjustPoints(
  userId: string,
  amount: number, // Can be positive or negative
  description: string,
  adminId: string
): Promise<void> {
  if (amount === 0) {
    throw new Error("Points adjustment cannot be zero");
  }

  // Get current user balance
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { pointsBalance: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const balanceBefore = user.pointsBalance || 0;
  const balanceAfter = balanceBefore + amount;

  if (balanceAfter < 0) {
    throw new Error("Points balance cannot be negative");
  }

  // Create transaction record
  await db.pointsTransaction.create({
    data: {
      userId,
      amount,
      type: "MANUAL_ADJUSTMENT",
      referenceId: adminId,
      description,
      balanceBefore,
      balanceAfter,
    },
  });

  // Update user balance
  await db.user.update({
    where: { id: userId },
    data: { pointsBalance: balanceAfter },
  });

  // Update affiliate stats if applicable
  const affiliate = await db.affiliate.findUnique({
    where: { userId },
  });

  if (affiliate) {
    const updateData: any = {
      currentPointsBalance: balanceAfter,
    };
    
    if (amount > 0) {
      updateData.totalPointsEarned = { increment: amount };
    }
    
    await db.affiliate.update({
      where: { userId },
      data: updateData,
    });
  }
}

/**
 * Get user's current points balance
 */
export async function getPointsBalance(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { pointsBalance: true },
  });

  return user?.pointsBalance || 0;
}

