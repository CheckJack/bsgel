import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    console.log("My Salon API - Session:", session?.user?.id, session?.user?.email);

    if (!session?.user?.id) {
      console.log("My Salon API - Unauthorized: No session or user ID");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find salon by userId
    const salon = await db.salon.findUnique({
      where: { userId: session.user.id },
    });

    console.log("My Salon API - Found salon:", salon ? salon.name : "none");

    if (!salon) {
      return NextResponse.json(
        { error: "Salon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(salon);
  } catch (error: any) {
    console.error("Failed to fetch user's salon:", error);
    return NextResponse.json(
      { error: "Failed to fetch salon", details: error?.message },
      { status: 500 }
    );
  }
}

