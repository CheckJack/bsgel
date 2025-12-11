import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (isActive === "true") {
      where.isActive = true;
    } else if (isActive === "false") {
      where.isActive = false;
    }

    const rewards = await db.reward.findMany({
      where,
      include: {
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to include redemption count
    const rewardsWithStats = rewards.map((reward) => ({
      ...reward,
      redemptionCount: reward._count.redemptions,
    }));

    return NextResponse.json(rewardsWithStats);
  } catch (error) {
    console.error("Failed to fetch rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      pointsCost,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      isActive,
      stock,
      validFrom,
      validUntil,
    } = body;

    if (!name || !pointsCost || !discountType || !discountValue) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (pointsCost <= 0) {
      return NextResponse.json(
        { error: "Points cost must be greater than 0" },
        { status: 400 }
      );
    }

    if (discountType === "PERCENTAGE" && (discountValue <= 0 || discountValue > 100)) {
      return NextResponse.json(
        { error: "Percentage discount must be between 1 and 100" },
        { status: 400 }
      );
    }

    if (discountType === "FIXED" && discountValue <= 0) {
      return NextResponse.json(
        { error: "Fixed discount must be greater than 0" },
        { status: 400 }
      );
    }

    const reward = await db.reward.create({
      data: {
        name,
        description: description || null,
        pointsCost: parseInt(pointsCost),
        discountType,
        discountValue: parseFloat(discountValue),
        minPurchaseAmount: minPurchaseAmount
          ? parseFloat(minPurchaseAmount)
          : null,
        maxDiscountAmount: maxDiscountAmount
          ? parseFloat(maxDiscountAmount)
          : null,
        isActive: isActive ?? true,
        stock: stock ? parseInt(stock) : null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    return NextResponse.json(reward);
  } catch (error) {
    console.error("Failed to create reward:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create reward" },
      { status: 500 }
    );
  }
}

