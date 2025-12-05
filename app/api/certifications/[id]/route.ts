import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const certification = await db.certification.findUnique({
      where: { id: params.id },
      include: {
        certificationCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    if (!certification) {
      return NextResponse.json(
        { error: "Certification not found" },
        { status: 404 }
      )
    }

    const formatted = {
      id: certification.id,
      name: certification.name,
      description: certification.description,
      isActive: certification.isActive,
      categories: certification.certificationCategories.map((cc) => ({
        id: cc.category.id,
        name: cc.category.name,
        slug: cc.category.slug,
      })),
      userCount: certification._count.users,
      createdAt: certification.createdAt,
      updatedAt: certification.updatedAt,
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Failed to fetch certification:", error)
    return NextResponse.json(
      { error: "Failed to fetch certification" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, isActive, categoryIds } = body

    // Check if certification exists
    const existingCert = await db.certification.findUnique({
      where: { id: params.id },
    })

    if (!existingCert) {
      return NextResponse.json(
        { error: "Certification not found" },
        { status: 404 }
      )
    }

    // If name is being updated, check for duplicates
    if (name && name.trim() !== existingCert.name) {
      const duplicateCert = await db.certification.findUnique({
        where: { name: name.trim() },
      })

      if (duplicateCert) {
        return NextResponse.json(
          { error: "A certification with this name already exists" },
          { status: 409 }
        )
      }
    }

    // Validate category IDs if provided
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      const categories = await db.category.findMany({
        where: {
          id: {
            in: categoryIds,
          },
        },
      })

      if (categories.length !== categoryIds.length) {
        return NextResponse.json(
          { error: "One or more category IDs are invalid" },
          { status: 400 }
        )
      }
    }

    // Update certification
    const updateData: any = {}

    if (name !== undefined) {
      updateData.name = name.trim()
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive)
    }

    // Handle category updates
    if (categoryIds !== undefined) {
      // Delete existing category associations
      await db.certificationCategory.deleteMany({
        where: { certificationId: params.id },
      })

      // Create new associations if categoryIds array is provided and not empty
      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        updateData.certificationCategories = {
          create: categoryIds.map((categoryId: string) => ({
            categoryId,
          })),
        }
      }
    }

    const certification = await db.certification.update({
      where: { id: params.id },
      data: updateData,
      include: {
        certificationCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    const formatted = {
      id: certification.id,
      name: certification.name,
      description: certification.description,
      isActive: certification.isActive,
      categories: certification.certificationCategories.map((cc) => ({
        id: cc.category.id,
        name: cc.category.name,
        slug: cc.category.slug,
      })),
      userCount: certification._count.users,
      createdAt: certification.createdAt,
      updatedAt: certification.updatedAt,
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Failed to update certification:", error)

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A certification with this name already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error?.message || "Failed to update certification" },
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if certification exists
    const certification = await db.certification.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    if (!certification) {
      return NextResponse.json(
        { error: "Certification not found" },
        { status: 404 }
      )
    }

    // Check if any users have this certification
    if (certification._count.users > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete certification. ${certification._count.users} user(s) currently have this certification assigned. Please reassign users before deleting.`,
        },
        { status: 400 }
      )
    }

    // Delete certification (cascade will delete CertificationCategory associations)
    await db.certification.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Certification deleted successfully" })
  } catch (error: any) {
    console.error("Failed to delete certification:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to delete certification" },
      { status: 500 }
    )
  }
}

