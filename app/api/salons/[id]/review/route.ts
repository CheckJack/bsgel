import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
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
    const { action, rejectionReason } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (action === "reject" && !rejectionReason?.trim()) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting a salon" },
        { status: 400 }
      );
    }

    // Check if salon exists
    const salon = await db.salon.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!salon) {
      return NextResponse.json(
        { error: "Salon not found" },
        { status: 404 }
      );
    }

    // Update salon status
    const updateData: any = {
      status: action === "approve" ? "APPROVED" : "REJECTED",
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    };

    if (action === "approve") {
      // When approving, also set isActive to true
      updateData.isActive = true;
      updateData.rejectionReason = null;
    } else {
      // When rejecting, set rejection reason and deactivate
      updateData.rejectionReason = rejectionReason.trim();
      updateData.isActive = false;
    }

    const updatedSalon = await db.salon.update({
      where: { id: params.id },
      data: updateData,
    });

    // Create notification for the salon owner if they exist
    if (salon.userId && salon.user) {
      const notificationType = action === "approve" ? "SALON_APPROVED" : "SALON_REJECTED";
      const notificationTitle = action === "approve" 
        ? "Salon Approved" 
        : "Salon Rejected";
      const notificationMessage = action === "approve"
        ? `Your salon "${salon.name}" has been approved and is now visible on the Find Your Salon page.`
        : `Your salon "${salon.name}" has been rejected. Reason: ${rejectionReason}`;

      await db.notification.create({
        data: {
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          userId: salon.userId,
          linkUrl: "/dashboard/salon",
        },
      });
    }

    return NextResponse.json({
      success: true,
      salon: updatedSalon,
      message: action === "approve" 
        ? "Salon approved successfully" 
        : "Salon rejected successfully",
    });
  } catch (error: any) {
    console.error("Failed to review salon:", error);
    return NextResponse.json(
      { error: "Failed to review salon", details: error?.message },
      { status: 500 }
    );
  }
}

