import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const updateCertificationSchema = z.object({
  certificationId: z.string().nullable().optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can update certifications
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { certificationId } = updateCertificationSchema.parse(body)

    // If certificationId is provided, verify it exists and is active
    if (certificationId !== null && certificationId !== undefined) {
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
    }

    // Update user certification
    const updateData: any = {}
    
    if (certificationId === null || certificationId === undefined || certificationId === "") {
      updateData.certification = { disconnect: true }
    } else {
      updateData.certification = { connect: { id: certificationId } }
    }

    const user = await db.user.update({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  return PUT(req, { params })
}

