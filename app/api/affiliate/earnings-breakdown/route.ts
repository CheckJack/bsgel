import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateAffiliate } from "@/lib/affiliate";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month"; // "month" or "year"

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const affiliate = await getOrCreateAffiliate(user.id, user.email!);

    // Get points transactions for this user
    const transactions = await db.pointsTransaction.findMany({
      where: {
        userId: user.id,
        amount: { gt: 0 }, // Only positive (earned) points
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by period
    const breakdown: Record<string, number> = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      let key: string;

      if (period === "year") {
        key = `${date.getFullYear()}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!breakdown[key]) {
        breakdown[key] = 0;
      }
      breakdown[key] += transaction.amount;
    });

    // Convert to array format
    const result = Object.entries(breakdown)
      .map(([period, points]) => ({
        period,
        points,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return NextResponse.json({ breakdown: result });
  } catch (error: any) {
    console.error("Failed to fetch earnings breakdown:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch earnings breakdown",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

