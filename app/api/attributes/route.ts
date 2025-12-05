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
          category: { contains: search, mode: "insensitive" as const },
        }
      : {}

    // Get total count for pagination
    const total = await db.attribute.count({ where })

    // Fetch attributes
    const attributes = await db.attribute.findMany({
      where,
      orderBy: {
        category: "asc",
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      attributes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Failed to fetch attributes:", error)
    
    // If it's a database schema error (fields don't exist), return empty array
    if (error?.message?.includes("Unknown column") || error?.code === "P2021") {
      return NextResponse.json({
        attributes: [],
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
        error: "Failed to fetch attributes",
        attributes: [],
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
    const { category, values } = body

    if (!category || !values || !Array.isArray(values)) {
      return NextResponse.json(
        { error: "Category and values array are required" },
        { status: 400 }
      )
    }

    const attribute = await db.attribute.create({
      data: {
        category,
        values,
      },
    })

    return NextResponse.json(attribute, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create attribute:", error)
    
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Attribute with this category already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to create attribute" },
      { status: 500 }
    )
  }
}

