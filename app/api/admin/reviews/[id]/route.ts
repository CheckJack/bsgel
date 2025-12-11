import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT - Approve or reject a review
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, companyResponse } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Check if review exists
    const review = await db.productReview.findUnique({
      where: { id: params.id },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Update review status
    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
    
    console.log(`[Admin Reviews] Updating review ${params.id} to status: ${newStatus}`);
    
    const updatedReview = await db.productReview.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        ...(companyResponse && { companyResponse }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`[Admin Reviews] Review updated successfully. Status: ${updatedReview.status}, ProductId: ${updatedReview.productId}`);

    // Verify the update worked
    const verifyReview = await db.productReview.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, productId: true },
    });

    if (verifyReview?.status !== newStatus) {
      console.error(`[Admin Reviews] Review status update failed. Expected ${newStatus}, got ${verifyReview?.status}`);
      return NextResponse.json(
        { error: "Failed to update review status. Please try again." },
        { status: 500 }
      );
    }

    console.log(`[Admin Reviews] Verification passed. Review ${params.id} is now ${verifyReview.status}`);

    return NextResponse.json({
      ...updatedReview,
      message: action === "approve" 
        ? "Review approved successfully" 
        : "Review rejected successfully",
    });
  } catch (error: any) {
    console.error("Failed to update review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a review
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const review = await db.productReview.findUnique({
      where: { id: params.id },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    await db.productReview.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}

