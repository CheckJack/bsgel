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

    const now = new Date();

    // Get all active rewards that are currently valid
    const rewards = await db.reward.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
      orderBy: { pointsCost: "asc" },
    });

    // Filter rewards by stock availability (redeemedCount is a direct field on Reward model)
    const availableRewards = rewards.filter((reward) => {
      if (reward.stock === null) return true; // Unlimited
      return reward.redeemedCount < reward.stock;
    });

    return NextResponse.json(availableRewards);
  } catch (error: any) {
    console.error("Failed to fetch rewards:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch rewards",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

