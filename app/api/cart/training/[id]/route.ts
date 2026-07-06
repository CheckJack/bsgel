import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { cancelPendingBooking } from "@/lib/cart-training";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const cartTrainingItem = await db.cartTrainingItem.findUnique({
      where: { id },
      include: {
        cart: true,
      },
    });

    if (!cartTrainingItem) {
      return NextResponse.json({ error: "Training cart item not found" }, { status: 404 });
    }

    if (cartTrainingItem.cart.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await cancelPendingBooking(cartTrainingItem.bookingId);

    await db.cartTrainingItem.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Training removed from cart" });
  } catch (error) {
    console.error("Failed to remove training cart item:", error);
    return NextResponse.json(
      { error: "Failed to remove training from cart" },
      { status: 500 }
    );
  }
}
