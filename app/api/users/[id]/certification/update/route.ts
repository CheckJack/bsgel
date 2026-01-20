import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const updateUserCertificationSchema = z.object({
  certificationId: z.string().min(1, "Certification ID is required"),
  certificate: z.string().max(15 * 1024 * 1024, "Certificate file is too large (max 10MB original file)").nullable().optional(),
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

    // Users can only update their own certification
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { certificationId, certificate } = updateUserCertificationSchema.parse(body)

    // Verify certification exists and is active
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

    // Update user certification
    // Setting certificateUrl will mark it as pending review again
    const updateData: any = {
      certificationId: certificationId,
      certificateUrl: certificate || null,
      // Disconnect existing certification relation to mark as pending
      certification: { disconnect: true },
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        certification: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Create notification about certification change
    try {
      await db.notification.create({
        data: {
          userId: id,
          type: "NEW_PROFESSIONAL_CERTIFICATION",
          title: "Certification Update Submitted",
          message: "Your certification change has been submitted and is pending review. We'll notify you once it's been reviewed.",
          read: false,
        },
      })
    } catch (notificationError) {
      // Don't fail the request if notification creation fails
      console.error("Failed to create notification:", notificationError)
    }

    return NextResponse.json({
      success: true,
      message: "Certification updated successfully. Your submission is pending review.",
      user: {
        id: user.id,
        certificationId: user.certificationId,
        certificateUrl: user.certificateUrl,
      },
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

