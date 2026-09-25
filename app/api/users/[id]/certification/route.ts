import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  sendCertificationApprovedEmail,
  sendCertificationRejectedEmail,
} from "@/lib/email/certification-alerts"
import { withNotificationI18n } from "@/lib/notifications/i18n"
import { z } from "zod"

const updateCertificationSchema = z.object({
  certificationId: z.string().nullable().optional(),
  reason: z.string().optional(),
  reject: z.boolean().optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can update certifications
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { certificationId, reason, reject } = updateCertificationSchema.parse(body)

    const existingUser = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        certificateUrl: true,
        certificationId: true,
        certification: { select: { id: true, name: true } },
      },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let approvedCertification: { id: string; name: string } | null = null
    const isDisconnect =
      certificationId === null ||
      certificationId === undefined ||
      certificationId === ""

    // If certificationId is provided, verify it exists and is active
    if (!isDisconnect) {
      const certification = await db.certification.findUnique({
        where: { id: certificationId },
      })

      if (!certification) {
        return NextResponse.json(
          { error: "Certification not found" },
          { status: 404 }
        )
      }

      if (!certification.isActive) {
        return NextResponse.json(
          { error: "Cannot assign inactive certification" },
          { status: 400 }
        )
      }

      if (certification.isSystem) {
        return NextResponse.json(
          { error: "Cannot assign a system certification to users" },
          { status: 400 }
        )
      }

      approvedCertification = { id: certification.id, name: certification.name }
    }

    const wasPending =
      !!existingUser.certificateUrl ||
      (!!existingUser.certificationId && !existingUser.certification)

    const trimmedReason = typeof reason === "string" ? reason.trim() : ""
    const isExplicitReject = isDisconnect && (reject === true || trimmedReason.length > 0)

    if (isExplicitReject && wasPending) {
      if (!trimmedReason || trimmedReason.length > 2000) {
        return NextResponse.json(
          { error: "A rejection reason between 1 and 2000 characters is required" },
          { status: 400 }
        )
      }
    }

    // Resolve pending certification name before disconnect
    let pendingCertName: string | null =
      existingUser.certification?.name || null
    if (!pendingCertName && existingUser.certificationId) {
      const pendingCert = await db.certification.findUnique({
        where: { id: existingUser.certificationId },
        select: { name: true },
      })
      pendingCertName = pendingCert?.name || null
    }

    // Update user certification
    const updateData: {
      certification?: { disconnect: true } | { connect: { id: string } }
      certificateUrl?: null
    } = {}

    if (isDisconnect) {
      updateData.certification = { disconnect: true }
      // Clear uploaded certificate so the user is not left in a pending state
      updateData.certificateUrl = null
    } else {
      // When approving (connecting certification), clear certificateUrl to indicate it's been reviewed
      updateData.certification = { connect: { id: certificationId! } }
      updateData.certificateUrl = null
    }

    const isApproving = !!approvedCertification
    const shouldNotifyApproval = isApproving && (wasPending || !existingUser.certification)
    // Notify on refuse when there was something pending (certificateUrl and/or cert id)
    const shouldNotifyRejection = isExplicitReject && wasPending

    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        orders: {
          select: {
            total: true,
          },
        },
        certification: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    if (shouldNotifyApproval && approvedCertification) {
      const certName = approvedCertification.name
      try {
        await db.notification.create({
          data: {
            userId: id,
            type: "CERTIFICATION_APPROVED",
            title: "Certification Approved",
            message: `Your certification "${certName}" has been approved. You now have full access to professional features and products.`,
            linkUrl: "/dashboard",
            read: false,
            metadata: {
              certificationId: approvedCertification.id,
              certificationName: certName,
            },
          },
        })
      } catch (notificationError) {
        console.error("Failed to create certification approval notification:", notificationError)
      }

      try {
        await sendCertificationApprovedEmail({
          to: user.email,
          customerName: user.name,
          certificationName: certName,
        })
      } catch (emailError) {
        console.error("Failed to send certification approval email:", emailError)
      }
    }

    if (shouldNotifyRejection) {
      const certName = pendingCertName || ""
      try {
        await db.notification.create({
          data: {
            userId: id,
            type: "SYSTEM",
            title: "Certification refused",
            message: `Your certification was not approved. Reason: ${trimmedReason}`,
            linkUrl: "/dashboard",
            read: false,
            metadata: withNotificationI18n(
              {
                reason: trimmedReason,
                certificationId: existingUser.certificationId,
                certificationName: certName || null,
                certName: certName || null,
                kind: "CERTIFICATION_REJECTED",
              },
              {
                titleKey: "inApp.certificationRejectedTitle",
                messageKey: "inApp.certificationRejectedMessage",
                params: {
                  reason: trimmedReason,
                  certName: certName || "",
                },
              }
            ),
          },
        })
      } catch (notificationError) {
        console.error("Failed to create certification rejection notification:", notificationError)
      }

      try {
        await sendCertificationRejectedEmail({
          to: user.email,
          customerName: user.name,
          certificationName: pendingCertName,
          reason: trimmedReason,
        })
      } catch (emailError) {
        console.error("Failed to send certification rejection email:", emailError)
      }
    }

    // Calculate total spent and order count
    const totalSpent = user.orders.reduce(
      (sum, order) => sum + parseFloat(order.total.toString()),
      0
    )
    const orderCount = user.orders.length

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      certification: user.certification
        ? {
            id: user.certification.id,
            name: user.certification.name,
            description: user.certification.description,
          }
        : null,
      certificateUrl: user.certificateUrl,
      createdAt: user.createdAt,
      totalSpent,
      orderCount,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to update certification:", error)
    return NextResponse.json(
      { error: "Failed to update certification" },
      { status: 500 }
    )
  }
}

// Keep PATCH for backward compatibility
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params })
}
