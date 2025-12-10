import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  permissions: z.record(z.enum(["allow", "deny"])).optional(),
  isActive: z.boolean().optional(),
  certificationId: z.string().nullable().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can view user details
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const user = await db.user.findUnique({
      where: { id: params.id },
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
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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
      permissions: user.permissions,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      certification: user.certification,
      certificateUrl: user.certificateUrl,
      createdAt: user.createdAt,
      totalSpent,
      orderCount,
    })
  } catch (error) {
    console.error("Failed to fetch user:", error)
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can update users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const updateData = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If email is being updated, check if new email already exists
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: updateData.email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const dataToUpdate: any = {}
    if (updateData.name !== undefined) {
      dataToUpdate.name = updateData.name.trim()
    }
    if (updateData.email !== undefined) {
      dataToUpdate.email = updateData.email
    }
    if (updateData.role !== undefined) {
      dataToUpdate.role = updateData.role
    }
    if (updateData.permissions !== undefined) {
      dataToUpdate.permissions = updateData.permissions
    }
    if (updateData.isActive !== undefined) {
      dataToUpdate.isActive = updateData.isActive
    }
    if (updateData.certificationId !== undefined) {
      if (updateData.certificationId === null || updateData.certificationId === "") {
        dataToUpdate.certification = { disconnect: true }
      } else {
        // Validate certification exists and is active
        const cert = await db.certification.findUnique({
          where: { id: updateData.certificationId },
        })
        if (!cert) {
          return NextResponse.json(
            { error: "Certification not found" },
            { status: 404 }
          )
        }
        if (!cert.isActive) {
          return NextResponse.json(
            { error: "Cannot assign inactive certification" },
            { status: 400 }
          )
        }
        dataToUpdate.certification = { connect: { id: updateData.certificationId } }
      }
    }
    if (updateData.password !== undefined) {
      // Hash the new password
      dataToUpdate.password = await hash(updateData.password, 10)
    }

    // Update user
    const user = await db.user.update({
      where: { id: params.id },
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
          },
        },
      },
      data: dataToUpdate,
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
      permissions: user.permissions,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      certification: user.certification ? {
        id: user.certification.id,
        name: user.certification.name,
      } : null,
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

    console.error("Failed to update user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can delete users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prevent deleting yourself
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user (cascade will handle related records like cart, orders, etc.)
    await db.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Failed to delete user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}

