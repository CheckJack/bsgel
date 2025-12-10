import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const sortField = searchParams.get("sortField") || "category"
    const sortDirection = searchParams.get("sortDirection") || "asc"

    // Build where clause for search (search in both category and values)
    const where = search
      ? {
          OR: [
            { category: { contains: search, mode: "insensitive" as const } },
            { values: { has: search } },
          ],
        }
      : {}

    // Get total count for pagination
    const total = await db.attribute.count({ where })

    // Fetch all attributes (we'll sort and paginate after calculating usage)
    const allAttributes = await db.attribute.findMany({
      where,
    })

    // Fetch all products to calculate usage statistics
    const allProducts = await db.product.findMany({
      select: {
        id: true,
        attributes: true,
      },
    })

    // Calculate usage count for each attribute
    const attributesWithUsage = allAttributes.map((attribute) => {
      let usageCount = 0
      
      // Count products that use this attribute category
      allProducts.forEach((product) => {
        if (product.attributes && typeof product.attributes === "object") {
          const attrs = product.attributes as Record<string, any>
          if (attrs[attribute.category]) {
            // Check if any of the attribute values are used
            const productValues = Array.isArray(attrs[attribute.category])
              ? attrs[attribute.category]
              : [attrs[attribute.category]]
            
            // If any value from this attribute is used in the product
            if (productValues.some((val: any) => 
              attribute.values.some((attrVal) => 
                String(val).toLowerCase() === String(attrVal).toLowerCase()
              )
            )) {
              usageCount++
            }
          }
        }
      })

      return {
        ...attribute,
        usageCount,
        valueCount: attribute.values.length,
      }
    })

    // Sort attributes
    let sortedAttributes = [...attributesWithUsage]
    if (sortField === "category") {
      sortedAttributes.sort((a, b) => {
        const comparison = a.category.localeCompare(b.category)
        return sortDirection === "asc" ? comparison : -comparison
      })
    } else if (sortField === "valueCount") {
      sortedAttributes.sort((a, b) => {
        const comparison = a.valueCount - b.valueCount
        return sortDirection === "asc" ? comparison : -comparison
      })
    } else if (sortField === "usageCount") {
      sortedAttributes.sort((a, b) => {
        const comparison = a.usageCount - b.usageCount
        return sortDirection === "asc" ? comparison : -comparison
      })
    } else if (sortField === "createdAt") {
      sortedAttributes.sort((a, b) => {
        const aDate = new Date(a.createdAt).getTime()
        const bDate = new Date(b.createdAt).getTime()
        const comparison = aDate - bDate
        return sortDirection === "asc" ? comparison : -comparison
      })
    }

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedAttributes = sortedAttributes.slice(startIndex, endIndex)

    return NextResponse.json({
      attributes: paginatedAttributes,
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

