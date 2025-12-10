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
    const pageParam = searchParams.get("page")
    const limitParam = searchParams.get("limit")
    const sortField = searchParams.get("sortField") || "createdAt"
    const sortDirection = searchParams.get("sortDirection") || "desc"

    // Check if pagination is requested
    const usePagination = pageParam !== null || limitParam !== null
    const page = pageParam ? parseInt(pageParam) : 1
    const limit = limitParam ? parseInt(limitParam) : usePagination ? 10 : 1000 // Large limit if no pagination

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (isActive !== null && isActive !== undefined && isActive !== "all") {
      where.isActive = isActive === "true"
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sortField === "name") {
      orderBy.name = sortDirection
    } else if (sortField === "userCount") {
      // For userCount, we need to sort after fetching
      orderBy.createdAt = "desc" // Default fallback
    } else if (sortField === "createdAt") {
      orderBy.createdAt = sortDirection
    } else if (sortField === "updatedAt") {
      orderBy.updatedAt = sortDirection
    } else {
      orderBy.createdAt = "desc"
    }

    // Get total count for pagination (only if pagination is used)
    let total = 0
    let totalPages = 0
    if (usePagination) {
      total = await db.certification.count({ where })
      totalPages = Math.ceil(total / limit)
    }

    // Calculate pagination
    const skip = usePagination ? (page - 1) * limit : 0
    const take = usePagination ? limit : undefined

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
      orderBy,
      ...(usePagination && { skip, take }),
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

    // Sort by userCount if needed (client-side sorting for aggregated fields)
    if (sortField === "userCount") {
      formatted.sort((a, b) => {
        if (sortDirection === "asc") {
          return a.userCount - b.userCount
        } else {
          return b.userCount - a.userCount
        }
      })
    }

    // Return paginated format if pagination was requested, otherwise return array for backward compatibility
    if (usePagination) {
      return NextResponse.json({
        certifications: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      })
    } else {
      return NextResponse.json(formatted)
    }
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

