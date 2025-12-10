import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { salonIds } = body;

    if (!Array.isArray(salonIds) || salonIds.length === 0) {
      return NextResponse.json(
        { error: "Salon IDs array is required" },
        { status: 400 }
      );
    }

    // Delete salons
    const result = await db.salon.deleteMany({
      where: {
        id: { in: salonIds },
      },
    });

    return NextResponse.json({
      message: "Salons deleted successfully",
      count: result.count,
    });
  } catch (error: any) {
    console.error("Failed to bulk delete salons:", error);
    return NextResponse.json(
      {
        error: "Failed to delete salons",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { salonIds, action, rejectionReason } = body;

    if (!Array.isArray(salonIds) || salonIds.length === 0) {
      return NextResponse.json(
        { error: "Salon IDs array is required" },
        { status: 400 }
      );
    }

    if (!action || !["approve", "reject", "activate", "deactivate"].includes(action)) {
      return NextResponse.json(
        { error: "Valid action (approve, reject, activate, deactivate) is required" },
        { status: 400 }
      );
    }

    if (action === "reject" && !rejectionReason?.trim()) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting salons" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (action === "approve") {
      updateData.status = "APPROVED";
      updateData.isActive = true;
      updateData.rejectionReason = null;
      updateData.reviewedBy = session.user.id;
      updateData.reviewedAt = new Date();
    } else if (action === "reject") {
      updateData.status = "REJECTED";
      updateData.isActive = false;
      updateData.rejectionReason = rejectionReason.trim();
      updateData.reviewedBy = session.user.id;
      updateData.reviewedAt = new Date();
    } else if (action === "activate") {
      updateData.isActive = true;
    } else if (action === "deactivate") {
      updateData.isActive = false;
    }

    // Update salons
    const result = await db.salon.updateMany({
      where: {
        id: { in: salonIds },
      },
      data: updateData,
    });

    // Create notifications for salon owners
    if (action === "approve" || action === "reject") {
      const salons = await db.salon.findMany({
        where: { id: { in: salonIds } },
        include: { user: true },
      });

      const notificationPromises = salons
        .filter((salon) => salon.userId && salon.user)
        .map((salon) => {
          const notificationType = action === "approve" ? "SALON_APPROVED" : "SALON_REJECTED";
          const notificationTitle = action === "approve" ? "Salon Approved" : "Salon Rejected";
          const notificationMessage =
            action === "approve"
              ? `Your salon "${salon.name}" has been approved and is now visible on the Find Your Salon page.`
              : `Your salon "${salon.name}" has been rejected. Reason: ${rejectionReason}`;

          return db.notification.create({
            data: {
              type: notificationType,
              title: notificationTitle,
              message: notificationMessage,
              userId: salon.userId!,
              linkUrl: "/dashboard/salon",
            },
          });
        });

      await Promise.all(notificationPromises);
    }

    return NextResponse.json({
      message: "Salons updated successfully",
      count: result.count,
    });
  } catch (error: any) {
    console.error("Failed to bulk update salons:", error);
    return NextResponse.json(
      {
        error: "Failed to update salons",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

