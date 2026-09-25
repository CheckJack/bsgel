import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findOrCreateOpenBookingSession } from "@/lib/training/open-booking-session";
import { reserveTrainingSessionForCart } from "@/lib/training/reserve-session-cart";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: programId } = await params;
    const body = await req.json().catch(() => ({}));
    const dateKey = typeof body?.date === "string" ? body.date : "";

    if (!dateKey) {
      return NextResponse.json(
        { error: "Date is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const trainingSession = await findOrCreateOpenBookingSession(programId, dateKey);
    const result = await reserveTrainingSessionForCart(
      session.user.id,
      trainingSession.id
    );

    return NextResponse.json({
      success: true,
      bookingId: result.bookingId,
      cartTrainingItemId: result.cartTrainingItemId,
      sessionId: trainingSession.id,
      startDate: trainingSession.startDate,
      endDate: trainingSession.endDate,
    });
  } catch (error: any) {
    console.error("Failed to reserve open booking date:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to reserve training date" },
      { status: 400 }
    );
  }
}
