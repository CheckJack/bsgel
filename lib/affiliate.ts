import { db } from "@/lib/db";
import { ReferralStatus } from "@prisma/client";

/**
 * Generate a unique affiliate code for a user
 */
export async function generateAffiliateCode(userId: string, email: string): Promise<string> {
  // Try to generate from email first
  const baseCode = email.split("@")[0].toUpperCase().replace(/[^A-Z0-9]/g, "");
  let code = baseCode.substring(0, 8); // Take first 8 characters
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  code = `${code}${randomSuffix}`;

  // Check if code already exists
  let existing = await db.affiliate.findUnique({
    where: { affiliateCode: code },
  });

  // If exists, try with different suffix
  let attempts = 0;
  while (existing && attempts < 10) {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `${baseCode.substring(0, 8)}${randomSuffix}`;
    existing = await db.affiliate.findUnique({
      where: { affiliateCode: code },
    });
    attempts++;
  }

  // If still exists, use userId as fallback
  if (existing) {
    code = `AFF${userId.substring(0, 8).toUpperCase()}`;
  }

  return code;
}

/**
 * Get or create affiliate record for a user
 */
export async function getOrCreateAffiliate(userId: string, email: string): Promise<{ id: string; affiliateCode: string }> {
  let affiliate = await db.affiliate.findUnique({
    where: { userId },
    select: { id: true, affiliateCode: true },
  });

  if (!affiliate) {
    const affiliateCode = await generateAffiliateCode(userId, email);
    
    affiliate = await db.affiliate.create({
      data: {
        userId,
        affiliateCode,
        isActive: true,
        approvedAt: new Date(), // Auto-approve for now, admin can change later
      },
      select: { id: true, affiliateCode: true },
    });
  }

  return affiliate;
}

/**
 * Validate and get affiliate by code
 */
export async function getAffiliateByCode(code: string): Promise<{ id: string; userId: string; isActive: boolean } | null> {
  const affiliate = await db.affiliate.findUnique({
    where: { affiliateCode: code },
    select: {
      id: true,
      userId: true,
      isActive: true,
    },
  });

  return affiliate;
}

/**
 * Create referral relationship
 */
export async function createReferral(
  affiliateId: string,
  referredUserId: string
): Promise<{ id: string }> {
  // Check if referral already exists
  const existing = await db.affiliateReferral.findUnique({
    where: { referredUserId },
  });

  if (existing) {
    return existing; // Already referred
  }

  // Create referral
  const referral = await db.affiliateReferral.create({
    data: {
      affiliateId,
      referredUserId,
      status: ReferralStatus.PENDING,
    },
  });

  // Update affiliate stats
  await db.affiliate.update({
    where: { id: affiliateId },
    data: {
      totalReferrals: { increment: 1 },
    },
  });

  return referral;
}

/**
 * Update referral status and link first order
 */
export async function activateReferral(
  referralId: string,
  firstOrderId: string
): Promise<void> {
  const referral = await db.affiliateReferral.findUnique({
    where: { id: referralId },
  });

  if (!referral) {
    throw new Error("Referral not found");
  }

  if (referral.status === ReferralStatus.PENDING) {
    // Update referral to active
    await db.affiliateReferral.update({
      where: { id: referralId },
      data: {
        status: ReferralStatus.ACTIVE,
        firstOrderId,
      },
    });

    // Update affiliate stats
    await db.affiliate.update({
      where: { id: referral.affiliateId },
      data: {
        activeReferrals: { increment: 1 },
      },
    });
  }
}

/**
 * Get referral for a user
 */
export async function getReferralByUserId(userId: string): Promise<{ id: string; affiliateId: string; status: string } | null> {
  const referral = await db.affiliateReferral.findUnique({
    where: { referredUserId: userId },
    select: {
      id: true,
      affiliateId: true,
      status: true,
    },
  });

  return referral;
}

