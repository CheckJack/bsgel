import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const sortField = searchParams.get("sortField") || "name"
    const sortDirection = searchParams.get("sortDirection") || "asc"

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

    // Build orderBy clause for database fields
    const dbOrderBy: any = {}
    if (sortField === "name" || sortField === "createdAt") {
      dbOrderBy[sortField] = sortDirection
    } else {
      // Default to name if sorting by computed fields (we'll sort after fetching)
      dbOrderBy.name = "asc"
    }

    // Fetch all categories with product counts and subcategories (we need all for sorting by computed fields)
    // This includes both main categories and subcategories
    let allCategories;
    try {
      // Use select to only get fields that exist in the database
      allCategories = await db.category.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          icon: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { products: true },
          },
          products: {
            select: {
              id: true,
              orderItems: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
        orderBy: dbOrderBy,
      });
      // Add missing fields that don't exist in DB
      allCategories = allCategories.map((cat: any) => ({
        ...cat,
        parentId: null,
        parent: null,
        subcategories: [],
        _count: {
          ...cat._count,
          subcategories: 0,
        },
      }));
    } catch (error: any) {
      // If schema doesn't match, use raw SQL
      console.log("Schema mismatch detected, using raw SQL for categories");
      let sqlQuery = `
        SELECT 
          c.id, c.name, c.slug, c.description, c.image, c.icon, c."createdAt", c."updatedAt",
          COUNT(DISTINCT p.id) as product_count
        FROM "Category" c
        LEFT JOIN "Product" p ON p."categoryId" = c.id
      `;
      
      // Add WHERE clause if needed
      if (search) {
        sqlQuery += ` WHERE (LOWER(c.name) LIKE '%${search.toLowerCase()}%' OR LOWER(c.slug) LIKE '%${search.toLowerCase()}%')`;
      }
      
      sqlQuery += ` GROUP BY c.id, c.name, c.slug, c.description, c.image, c.icon, c."createdAt", c."updatedAt"`;
      
      // Add ORDER BY
      if (sortField === "name") {
        sqlQuery += ` ORDER BY c.name ${sortDirection.toUpperCase()}`;
      } else if (sortField === "createdAt") {
        sqlQuery += ` ORDER BY c."createdAt" ${sortDirection.toUpperCase()}`;
      } else {
        sqlQuery += ` ORDER BY c.name ASC`;
      }
      
      const result = await db.$queryRawUnsafe(sqlQuery);
      allCategories = (result as any[]).map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        image: row.image,
        icon: row.icon,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        parentId: null,
        parent: null,
        subcategories: [],
        _count: {
          products: parseInt(row.product_count) || 0,
          subcategories: 0,
        },
        products: [],
      }));
    }

    // Calculate quantity (product count) and sale (order items count) for each category
    let categoriesWithStats = allCategories.map((category: any) => {
      const quantity = category._count?.products || 0
      // Count order items for products in this category
      const sale = Array.isArray(category.products)
        ? category.products.reduce(
            (sum: number, product: any) => sum + (Array.isArray(product.orderItems) ? product.orderItems.length : 0),
            0
          )
        : 0

      const categoryData = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image || null,
        icon: category.icon || null,
        parentId: category.parentId || null,
        parent: category.parent || null,
        subcategories: (category.subcategories || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          image: sub.image || null,
          icon: sub.icon || null,
          quantity: sub._count?.products || 0,
        })),
        quantity,
        sale,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }
      
      // Debug: log categories with parentId
      if (categoryData.parentId) {
        console.log(`Category "${categoryData.name}" has parentId: ${categoryData.parentId}`);
      }
      
      return categoryData;
    })
    
    // The allCategories already includes both main categories and subcategories
    // because findMany returns all categories regardless of parentId
    // So categoriesWithStats already contains all categories in a flat list

    // Sort by computed fields if needed
    if (sortField === "quantity" || sortField === "sale") {
      categoriesWithStats.sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]
        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
        }
      })
    }

    // Apply pagination after sorting
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedCategories = categoriesWithStats.slice(startIndex, endIndex)

    return NextResponse.json({
      categories: paginatedCategories,
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
    const { name, slug, description, image, icon, parentId } = body

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

    // If parentId is provided, verify it exists
    if (parentId) {
      try {
        const parentCategory = await db.category.findUnique({
          where: { id: parentId },
        })
        
        if (!parentCategory) {
          return NextResponse.json(
            { error: "Parent category not found" },
            { status: 400 }
          )
        }
        
        // Prevent nested subcategories (subcategories can't have subcategories)
        if ((parentCategory as any).parentId) {
          return NextResponse.json(
            { error: "Subcategories cannot have subcategories. Please select a main category as parent." },
            { status: 400 }
          )
        }
      } catch (error: any) {
        // If parentId field doesn't exist in schema yet, ignore parentId
        console.log("ParentId field not available yet");
      }
    }

    const categoryData: any = {
      name,
      slug: normalizedSlug,
      description: description || null,
      image: image || null,
      icon: icon || null,
    };
    
    // Only add parentId if provided (will be ignored if schema doesn't support it yet)
    if (parentId) {
      categoryData.parentId = parentId;
    }

    let category;
    try {
      // Create category without include to avoid relation errors
      console.log("Creating category with data:", categoryData);
      category = await db.category.create({
        data: categoryData,
      });
      console.log("Category created successfully:", category);
    } catch (error: any) {
      console.error("Error creating category:", error);
      // If parentId field doesn't exist, create without it
      if (error?.message?.includes("parentId") || error?.code === "P2009") {
        const { parentId: _, ...dataWithoutParent } = categoryData;
        category = await db.category.create({
          data: dataWithoutParent,
        });
      } else {
        throw error;
      }
    }

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

