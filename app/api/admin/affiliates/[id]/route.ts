import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { adjustPoints } from "@/lib/points";
import { logAdminAction, extractRequestInfo, getActionDescription } from "@/lib/admin-logger";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const affiliate = await db.affiliate.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            createdAt: true,
          },
        },
        referrals: {
          include: {
            referredUser: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    // Get recent transactions
    const recentTransactions = await db.pointsTransaction.findMany({
      where: { userId: affiliate.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Get active referrals count
    const activeReferrals = await db.affiliateReferral.count({
      where: {
        affiliateId: affiliate.id,
        status: "ACTIVE",
      },
    });

    // Get total orders from referrals
    const referralOrders = await db.order.count({
      where: {
        affiliateReferral: {
          affiliateId: affiliate.id,
        },
      },
    });

    return NextResponse.json({
      ...affiliate,
      activeReferrals,
      referralOrders,
      recentTransactions,
    });
  } catch (error) {
    console.error("Failed to fetch affiliate:", error);
    return NextResponse.json(
      { error: "Failed to fetch affiliate" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { isActive, approvedBy, pointsAdjustment, pointsDescription } = body;

    const affiliate = await db.affiliate.findUnique({
      where: { id: params.id },
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const updateData: any = {};
    const { ipAddress, userAgent } = extractRequestInfo(req);
    const affiliateUser = await db.user.findUnique({
      where: { id: affiliate.userId },
      select: { email: true, name: true },
    });

    // Track what changes are being made for logging
    const changes: string[] = [];

    if (typeof isActive === "boolean" && isActive !== affiliate.isActive) {
      updateData.isActive = isActive;
      changes.push(`Affiliate ${isActive ? 'activated' : 'deactivated'}`);
    }

    if (approvedBy && !affiliate.approvedAt) {
      updateData.approvedAt = new Date();
      updateData.approvedBy = approvedBy;
      changes.push("Affiliate approved");
    }

    // Handle manual points adjustment
    if (pointsAdjustment && typeof pointsAdjustment === "number" && pointsAdjustment !== 0) {
      // Get user info before adjustment for logging
      const userBefore = await db.user.findUnique({
        where: { id: affiliate.userId },
        select: { pointsBalance: true },
      });

      await adjustPoints(
        affiliate.userId,
        pointsAdjustment,
        pointsDescription || `Manual adjustment by admin`,
        session.user.id!
      );

      // Get user info after adjustment for logging
      const userAfter = await db.user.findUnique({
        where: { id: affiliate.userId },
        select: { pointsBalance: true },
      });

      // Log the admin action (ipAddress, userAgent, and affiliateUser already defined above)

      await logAdminAction({
        userId: session.user.id!,
        actionType: "UPDATE" as any,
        resourceType: "Affiliate",
        resourceId: params.id,
        description: `Adjusted ${pointsAdjustment > 0 ? 'added' : 'removed'} ${Math.abs(pointsAdjustment)} points for affiliate (${affiliateUser?.email || affiliateUser?.name || affiliate.userId})`,
        details: {
          before: { pointsBalance: userBefore?.pointsBalance || 0 },
          after: { pointsBalance: userAfter?.pointsBalance || 0 },
          changes: {
            pointsBalance: {
              from: userBefore?.pointsBalance || 0,
              to: userAfter?.pointsBalance || 0,
            },
          },
          adjustment: pointsAdjustment,
          description: pointsDescription || `Manual adjustment by admin`,
        },
        ipAddress,
        userAgent,
        metadata: {
          url: req.url,
          method: "PATCH",
          affiliateId: params.id,
          affiliateUserId: affiliate.userId,
        },
      });
    }

    if (Object.keys(updateData).length > 0) {
      const affiliateBefore = { ...affiliate };
      await db.affiliate.update({
        where: { id: params.id },
        data: updateData,
      });

      // Log affiliate status changes
      if (changes.length > 0) {
        const actionType = updateData.approvedAt ? "APPROVE" : 
                          (updateData.isActive === true ? "ACTIVATE" : "DEACTIVATE");
        
        await logAdminAction({
          userId: session.user.id!,
          actionType,
          resourceType: "Affiliate",
          resourceId: params.id,
          description: changes.join(", ") + ` for affiliate (${affiliateUser?.email || affiliateUser?.name || affiliate.userId})`,
          details: {
            before: {
              isActive: affiliateBefore.isActive,
              approvedAt: affiliateBefore.approvedAt,
              approvedBy: affiliateBefore.approvedBy,
            },
            after: {
              isActive: updateData.isActive ?? affiliateBefore.isActive,
              approvedAt: updateData.approvedAt ?? affiliateBefore.approvedAt,
              approvedBy: updateData.approvedBy ?? affiliateBefore.approvedBy,
            },
          },
          ipAddress,
          userAgent,
          metadata: {
            url: req.url,
            method: "PATCH",
            affiliateId: params.id,
            affiliateUserId: affiliate.userId,
          },
        });
      }
    }

    const updated = await db.affiliate.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update affiliate:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update affiliate" },
      { status: 500 }
    );
  }
}

