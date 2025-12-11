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

    // Count affiliates by tier
    const [bronze, silver, gold, platinum] = await Promise.all([
      db.affiliate.count({ where: { tier: "BRONZE" } }),
      db.affiliate.count({ where: { tier: "SILVER" } }),
      db.affiliate.count({ where: { tier: "GOLD" } }),
      db.affiliate.count({ where: { tier: "PLATINUM" } }),
    ]);

    return NextResponse.json({
      BRONZE: bronze,
      SILVER: silver,
      GOLD: gold,
      PLATINUM: platinum,
    });
  } catch (error: any) {
    console.error("Failed to fetch tier distribution:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tier distribution",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

