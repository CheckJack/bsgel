import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { reserveTrainingSessionForCart } from "@/lib/training/reserve-session-cart";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await params;
    const result = await reserveTrainingSessionForCart(session.user.id, sessionId);

    return NextResponse.json({
      success: true,
      bookingId: result.bookingId,
      cartTrainingItemId: result.cartTrainingItemId,
    });
  } catch (error: any) {
    console.error("Failed to reserve training session for cart:", error);

    return NextResponse.json(
      {
        error: error?.message || "Failed to reserve training session",
      },
      { status: 400 }
    );
  }
}
