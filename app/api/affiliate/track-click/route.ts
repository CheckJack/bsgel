import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const { affiliateCode } = await req.json();

    if (!affiliateCode) {
      return NextResponse.json(
        { error: "Affiliate code is required" },
        { status: 400 }
      );
    }

    // Find affiliate by code
    const affiliate = await db.affiliate.findUnique({
      where: { affiliateCode },
    });

    if (!affiliate || !affiliate.isActive) {
      return NextResponse.json(
        { error: "Invalid affiliate code" },
        { status: 404 }
      );
    }

    // Get IP and user agent from headers
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Create click record
    const click = await db.affiliateLinkClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, clickId: click.id });
  } catch (error: any) {
    console.error("Failed to track affiliate link click:", error);
    return NextResponse.json(
      {
        error: "Failed to track click",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

