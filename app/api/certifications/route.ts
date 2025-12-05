import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const isActive = searchParams.get("isActive")

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true"
    }

    const certifications = await db.certification.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    })

    const formatted = certifications.map((cert) => ({
      id: cert.id,
      name: cert.name,
      description: cert.description,
      isActive: cert.isActive,
      categories: cert.certificationCategories.map((cc) => ({
        id: cc.category.id,
        name: cc.category.name,
        slug: cc.category.slug,
      })),
      userCount: cert._count.users,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt,
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Failed to fetch certifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch certifications" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
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

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Check if certification with this name already exists
    const existingCert = await db.certification.findUnique({
      where: { name: name.trim() },
    })

    if (existingCert) {
      return NextResponse.json(
        { error: "A certification with this name already exists" },
        { status: 409 }
      )
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

    // Create certification with category associations
    const certification = await db.certification.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        certificationCategories: categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0
          ? {
              create: categoryIds.map((categoryId: string) => ({
                categoryId,
              })),
            }
          : undefined,
      },
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

    return NextResponse.json(formatted, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create certification:", error)

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A certification with this name already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error?.message || "Failed to create certification" },
      { status: 500 }
    )
  }
}

