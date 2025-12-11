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

    const configs = await db.pointsConfiguration.findMany({
      where,
      orderBy: [
        { actionType: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Failed to fetch points configurations:", error);
    return NextResponse.json(
      { error: "Failed to fetch points configurations" },
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
      actionType,
      pointsAmount,
      tieredConfig,
      minOrderValue,
      maxPointsPerTransaction,
      isActive,
      validFrom,
      validUntil,
    } = body;

    if (!actionType) {
      return NextResponse.json(
        { error: "Action type is required" },
        { status: 400 }
      );
    }

    // Validate that either pointsAmount or tieredConfig is provided
    if (!pointsAmount && !tieredConfig) {
      return NextResponse.json(
        { error: "Either pointsAmount or tieredConfig must be provided" },
        { status: 400 }
      );
    }

    // Validate tiered config structure if provided
    if (tieredConfig) {
      if (!tieredConfig.tiers || !Array.isArray(tieredConfig.tiers)) {
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
        if (
          typeof tier.points !== "number" ||
          tier.points < 0
        ) {
          return NextResponse.json(
            { error: "Invalid tier points" },
            { status: 400 }
          );
        }
      }
    }

    const config = await db.pointsConfiguration.create({
      data: {
        actionType,
        pointsAmount: pointsAmount ?? null,
        tieredConfig: tieredConfig ?? null,
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        maxPointsPerTransaction: maxPointsPerTransaction
          ? parseInt(maxPointsPerTransaction)
          : null,
        isActive: isActive ?? true,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to create points configuration:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create points configuration" },
      { status: 500 }
    );
  }
}

