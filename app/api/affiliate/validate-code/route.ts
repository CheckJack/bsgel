import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Affiliate code is required" },
        { status: 400 }
      );
    }

    // Find affiliate by code
    const affiliate = await db.affiliate.findUnique({
      where: { affiliateCode: code.toUpperCase().trim() },
      select: {
        id: true,
        isActive: true,
        userId: true,
      },
    });

    if (!affiliate) {
      return NextResponse.json({ valid: false });
    }

    if (!affiliate.isActive) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error("Failed to validate affiliate code:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Failed to validate affiliate code",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

