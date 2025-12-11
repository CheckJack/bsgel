import { db } from "@/lib/db";

interface MilestoneCheck {
  userId: string;
  affiliateId: string;
  type: "first_referral" | "referrals_10" | "referrals_100" | "points_1000" | "first_redemption";
}

/**
 * Check and send notifications for affiliate milestones
 */
export async function checkAndNotifyMilestones(
  userId: string,
  affiliateId: string
): Promise<void> {
  try {
    // Get affiliate stats
    const affiliate = await db.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        referrals: {
          select: { id: true },
        },
      },
    });

    if (!affiliate) return;

    const totalReferrals = affiliate.referrals.length;
    const totalPoints = affiliate.totalPointsEarned;

    // Check for first referral
    if (totalReferrals === 1) {
      await notifyMilestone(userId, "first_referral", {
        referrals: totalReferrals,
      });
    }

    // Check for 10 referrals
    if (totalReferrals === 10) {
      await notifyMilestone(userId, "referrals_10", {
        referrals: totalReferrals,
      });
    }

    // Check for 100 referrals
    if (totalReferrals === 100) {
      await notifyMilestone(userId, "referrals_100", {
        referrals: totalReferrals,
      });
    }

    // Check for 1000 points
    if (totalPoints >= 1000 && totalPoints < 1100) {
      // Only notify once when crossing 1000
      const previousPoints = totalPoints - 100; // Approximate previous value
      if (previousPoints < 1000) {
        await notifyMilestone(userId, "points_1000", {
          points: totalPoints,
        });
      }
    }
  } catch (error) {
    console.error("Failed to check milestones:", error);
    // Don't throw - milestone checking shouldn't break the main flow
  }
}

/**
 * Check for first redemption milestone
 */
export async function checkFirstRedemptionMilestone(
  userId: string,
  affiliateId: string
): Promise<void> {
  try {
    // Check if this is the first redemption
    const redemptions = await db.pointsRedemption.count({
      where: { userId },
    });

    if (redemptions === 1) {
      await notifyMilestone(userId, "first_redemption", {});
    }
  } catch (error) {
    console.error("Failed to check redemption milestone:", error);
  }
}

/**
 * Send milestone notification
 */
async function notifyMilestone(
  userId: string,
  type: MilestoneCheck["type"],
  data: Record<string, any>
): Promise<void> {
  const messages: Record<string, { title: string; message: string }> = {
    first_referral: {
      title: "🎉 First Referral!",
      message: "Congratulations! You've got your first referral. Keep sharing your link to earn more points!",
    },
    referrals_10: {
      title: "🌟 10 Referrals Milestone!",
      message: "Amazing! You've reached 10 referrals. You're building a great network!",
    },
    referrals_100: {
      title: "🏆 100 Referrals Achievement!",
      message: "Incredible! You've reached 100 referrals. You're a top affiliate!",
    },
    points_1000: {
      title: "💰 1000 Points Milestone!",
      message: `Congratulations! You've earned over ${data.points} points. Keep up the great work!`,
    },
    first_redemption: {
      title: "🎁 First Reward Redeemed!",
      message: "Great! You've redeemed your first reward. Enjoy your discount!",
    },
  };

  const notification = messages[type];
  if (!notification) return;

  try {
    // Create in-app notification
    await db.notification.create({
      data: {
        type: "SYSTEM",
        title: notification.title,
        message: notification.message,
        userId,
        metadata: {
          milestoneType: type,
          ...data,
        },
      },
    });

    // TODO: Integrate with email service (SendGrid, SMTP, etc.)
    // For now, we just create in-app notifications
    // Example:
    // await sendEmail({
    //   to: user.email,
    //   subject: notification.title,
    //   body: notification.message,
    // });
  } catch (error) {
    console.error(`Failed to send milestone notification (${type}):`, error);
  }
}

