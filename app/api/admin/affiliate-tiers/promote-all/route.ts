import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { autoPromoteAffiliate } from "@/lib/affiliate-tiers";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all affiliates
    const affiliates = await db.affiliate.findMany({
      select: { id: true },
    });

    // Promote each affiliate
    let promoted = 0;
    for (const affiliate of affiliates) {
      try {
        await autoPromoteAffiliate(affiliate.id);
        promoted++;
      } catch (error) {
        console.error(`Failed to promote affiliate ${affiliate.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      total: affiliates.length,
      promoted,
    });
  } catch (error: any) {
    console.error("Failed to promote all affiliates:", error);
    return NextResponse.json(
      {
        error: "Failed to promote affiliates",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

