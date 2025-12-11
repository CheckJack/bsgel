import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await db.pointsConfiguration.findUnique({
      where: { id: params.id },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to fetch points configuration:", error);
    return NextResponse.json(
      { error: "Failed to fetch points configuration" },
      { status: 500 }
    );
  }
}

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
      actionType,
      pointsAmount,
      tieredConfig,
      minOrderValue,
      maxPointsPerTransaction,
      isActive,
      validFrom,
      validUntil,
    } = body;

    const updateData: any = {};

    if (actionType !== undefined) {
      updateData.actionType = actionType;
    }
    if (pointsAmount !== undefined) {
      updateData.pointsAmount = pointsAmount ?? null;
    }
    if (tieredConfig !== undefined) {
      // Validate tiered config structure if provided
      if (tieredConfig && tieredConfig.tiers) {
        if (!Array.isArray(tieredConfig.tiers)) {
          return NextResponse.json(
            { error: "Tiered config must have a tiers array" },
            { status: 400 }
          );
        }

        // Validate tiers
        for (const tier of tieredConfig.tiers) {
          if (typeof tier.minOrderValue !== "number" || tier.minOrderValue < 0) {
            return NextResponse.json(
              { error: "Invalid tier minOrderValue" },
              { status: 400 }
            );
          }
          if (
            tier.maxOrderValue !== null &&
            typeof tier.maxOrderValue !== "number"
          ) {
            return NextResponse.json(
              { error: "Invalid tier maxOrderValue" },
              { status: 400 }
            );
          }
          if (typeof tier.points !== "number" || tier.points < 0) {
            return NextResponse.json(
              { error: "Invalid tier points" },
              { status: 400 }
            );
          }
        }
      }
      updateData.tieredConfig = tieredConfig ?? null;
    }
    if (minOrderValue !== undefined) {
      updateData.minOrderValue = minOrderValue ? parseFloat(minOrderValue) : null;
    }
    if (maxPointsPerTransaction !== undefined) {
      updateData.maxPointsPerTransaction = maxPointsPerTransaction
        ? parseInt(maxPointsPerTransaction)
        : null;
    }
    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }
    if (validFrom !== undefined) {
      updateData.validFrom = validFrom ? new Date(validFrom) : new Date();
    }
    if (validUntil !== undefined) {
      updateData.validUntil = validUntil ? new Date(validUntil) : null;
    }

    const config = await db.pointsConfiguration.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to update points configuration:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update points configuration" },
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

    await db.pointsConfiguration.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete points configuration:", error);
    return NextResponse.json(
      { error: "Failed to delete points configuration" },
      { status: 500 }
    );
  }
}

