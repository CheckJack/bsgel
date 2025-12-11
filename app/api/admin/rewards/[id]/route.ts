import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (pointsCost !== undefined) {
      if (pointsCost <= 0) {
        return NextResponse.json(
          { error: "Points cost must be greater than 0" },
          { status: 400 }
        );
      }
      updateData.pointsCost = parseInt(pointsCost);
    }
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) {
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
      updateData.discountValue = parseFloat(discountValue);
    }
    if (minPurchaseAmount !== undefined) {
      updateData.minPurchaseAmount = minPurchaseAmount
        ? parseFloat(minPurchaseAmount)
        : null;
    }
    if (maxDiscountAmount !== undefined) {
      updateData.maxDiscountAmount = maxDiscountAmount
        ? parseFloat(maxDiscountAmount)
        : null;
    }
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (stock !== undefined) {
      updateData.stock = stock ? parseInt(stock) : null;
    }
    if (validFrom !== undefined) {
      updateData.validFrom = validFrom ? new Date(validFrom) : new Date();
    }
    if (validUntil !== undefined) {
      updateData.validUntil = validUntil ? new Date(validUntil) : null;
    }

    const reward = await db.reward.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(reward);
  } catch (error) {
    console.error("Failed to update reward:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update reward" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if reward has redemptions
    const redemptionCount = await db.pointsRedemption.count({
      where: { rewardId: params.id },
    });

    if (redemptionCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete reward with existing redemptions. Deactivate it instead." },
        { status: 400 }
      );
    }

    await db.reward.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete reward:", error);
    return NextResponse.json(
      { error: "Failed to delete reward" },
      { status: 500 }
    );
  }
}

