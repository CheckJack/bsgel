import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}

    // Get total count for pagination
    const total = await db.category.count({ where })

    // Fetch categories with product counts
    const categories = await db.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
        products: {
          include: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Calculate quantity (product count) and sale (order items count) for each category
    const categoriesWithStats = categories.map((category) => {
      const quantity = category._count.products
      // Count order items for products in this category
      const sale = category.products.reduce(
        (sum, product) => sum + product.orderItems.length,
        0
      )

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: (category as any).image || null,
        icon: (category as any).icon || null,
        quantity,
        sale,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }
    })

    return NextResponse.json({
      categories: categoriesWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Failed to fetch categories:", error)
    
    // If it's a database schema error (fields don't exist), return empty array
    // This can happen if migration hasn't been run yet
    if (error?.message?.includes("Unknown column") || error?.code === "P2021") {
      return NextResponse.json({
        categories: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      })
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch categories",
        categories: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, slug, description, image, icon } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      )
    }

    // Normalize slug to lowercase for checking
    const normalizedSlug = slug.toLowerCase().trim()

    // Check if a category with this slug already exists
    const existingCategory = await db.category.findUnique({
      where: { slug: normalizedSlug },
      select: { name: true, slug: true },
    })

    if (existingCategory) {
      return NextResponse.json(
        { 
          error: `A category with this slug already exists. The category "${existingCategory.name}" uses the slug "${existingCategory.slug}". Please use a different name or slug.` 
        },
        { status: 400 }
      )
    }

    const category = await db.category.create({
      data: {
        name,
        slug: normalizedSlug,
        description: description || null,
        image: image || null,
        icon: icon || null,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create category:", error)
    
    // Check for duplicate slug (fallback in case the check above didn't catch it due to race condition)
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this slug already exists. Please use a different name or slug." },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || "Failed to create category" },
      { status: 500 }
    )
  }
}

