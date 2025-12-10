import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get("categoryId")
    const search = searchParams.get("search")
    const featured = searchParams.get("featured")
    const showcasingSection = searchParams.get("showcasingSection")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sortBy = searchParams.get("sortBy") || "newest"
    const pageParam = searchParams.get("page")
    const limitParam = searchParams.get("limit")
    
    // Check if pagination is requested
    const usePagination = pageParam !== null || limitParam !== null
    const page = pageParam ? parseInt(pageParam) : 1
    const limit = limitParam ? parseInt(limitParam) : 12

    const where: any = {}

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (featured === "true") {
      where.featured = true
    }

    if (showcasingSection) {
      where.showcasingSections = {
        has: showcasingSection
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) {
        where.price.gte = parseFloat(minPrice)
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice)
      }
    }

    // Sort options
    let orderBy: any = { createdAt: "desc" } // default
    switch (sortBy) {
      case "price-asc":
        orderBy = { price: "asc" }
        break
      case "price-desc":
        orderBy = { price: "desc" }
        break
      case "name-asc":
        orderBy = { name: "asc" }
        break
      case "name-desc":
        orderBy = { name: "desc" }
        break
      case "newest":
        orderBy = { createdAt: "desc" }
        break
      case "oldest":
        orderBy = { createdAt: "asc" }
        break
      default:
        orderBy = { createdAt: "desc" }
    }

    let products;
    try {
      products = await db.product.findMany({
        where,
        include: {
          category: true,
          subcategories: {
            include: {
              category: true,
            },
          },
        },
        orderBy,
        ...(usePagination && {
          skip: (page - 1) * limit,
          take: limit,
        }),
      });
    } catch (error: any) {
      // If schema hasn't been migrated yet, use simpler query without subcategory
      try {
        console.log("Subcategory relation not available, using fallback query");
        products = await db.product.findMany({
          where,
          include: {
            category: true,
          },
          orderBy,
          ...(usePagination && {
            skip: (page - 1) * limit,
            take: limit,
          }),
        });
      } catch (fallbackError: any) {
        // If Prisma still fails (e.g., missing columns), use raw SQL
        console.log("Prisma query failed, using raw SQL fallback");
        let sqlQuery = `
          SELECT 
            p.id, p.name, p.description, p.price, p.image, p.images, p.featured, p."categoryId",
            p."createdAt", p."updatedAt",
            c.id as category_id, c.name as category_name
          FROM "Product" p
          LEFT JOIN "Category" c ON p."categoryId" = c.id
          WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (categoryId) {
          sqlQuery += ` AND p."categoryId" = $${paramIndex}`;
          params.push(categoryId);
          paramIndex++;
        }

        if (search) {
          sqlQuery += ` AND (LOWER(p.name) LIKE $${paramIndex} OR LOWER(COALESCE(p.description, '')) LIKE $${paramIndex})`;
          params.push(`%${search.toLowerCase()}%`);
          paramIndex++;
        }

        if (featured === "true") {
          sqlQuery += ` AND p.featured = true`;
        }

        if (showcasingSection) {
          sqlQuery += ` AND $${paramIndex} = ANY(p."showcasingSections")`;
          params.push(showcasingSection);
          paramIndex++;
        }

        if (minPrice) {
          sqlQuery += ` AND p.price >= $${paramIndex}`;
          params.push(parseFloat(minPrice));
          paramIndex++;
        }

        if (maxPrice) {
          sqlQuery += ` AND p.price <= $${paramIndex}`;
          params.push(parseFloat(maxPrice));
          paramIndex++;
        }

        // Add sorting
        const sortField = sortBy === "price-asc" || sortBy === "price-desc" ? "p.price" :
                         sortBy === "name-asc" || sortBy === "name-desc" ? "p.name" :
                         "p.\"createdAt\"";
        const sortOrder = sortBy === "price-asc" || sortBy === "name-asc" || sortBy === "oldest" ? "ASC" : "DESC";
        sqlQuery += ` ORDER BY ${sortField} ${sortOrder}`;

        // Add pagination
        if (usePagination) {
          sqlQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
          params.push(limit, (page - 1) * limit);
        }

        const rawProducts = await db.$queryRawUnsafe(sqlQuery, ...params) as any[];
        
        // Transform raw SQL results to match expected format
        products = rawProducts.map((row: any) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          price: row.price,
          image: row.image,
          images: Array.isArray(row.images) ? row.images : (row.images ? [row.images] : []),
          featured: row.featured,
          categoryId: row.categoryId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          category: row.category_id ? {
            id: row.category_id,
            name: row.category_name,
          } : null,
        }));
      }
    }

    // If pagination is requested, return paginated response
    if (usePagination) {
      let total;
      try {
        total = await db.product.count({ where });
      } catch (error: any) {
        // If count fails, use raw SQL
        let countQuery = `SELECT COUNT(*) as count FROM "Product" p WHERE 1=1`;
        const countParams: any[] = [];
        let paramIndex = 1;

        if (categoryId) {
          countQuery += ` AND p."categoryId" = $${paramIndex}`;
          countParams.push(categoryId);
          paramIndex++;
        }

        if (search) {
          countQuery += ` AND (LOWER(p.name) LIKE $${paramIndex} OR LOWER(COALESCE(p.description, '')) LIKE $${paramIndex})`;
          countParams.push(`%${search.toLowerCase()}%`);
          paramIndex++;
        }

        if (featured === "true") {
          countQuery += ` AND p.featured = true`;
        }

        if (showcasingSection) {
          countQuery += ` AND $${paramIndex} = ANY(p."showcasingSections")`;
          countParams.push(showcasingSection);
          paramIndex++;
        }

        if (minPrice) {
          countQuery += ` AND p.price >= $${paramIndex}`;
          countParams.push(parseFloat(minPrice));
          paramIndex++;
        }

        if (maxPrice) {
          countQuery += ` AND p.price <= $${paramIndex}`;
          countParams.push(parseFloat(maxPrice));
          paramIndex++;
        }

        const countResult = await db.$queryRawUnsafe(countQuery, ...countParams) as any[];
        total = parseInt(countResult[0]?.count || "0");
      }
      const totalPages = Math.ceil(total / limit)

      return NextResponse.json({
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      })
    }

    // Otherwise, return the old format (just products array) for backward compatibility
    return NextResponse.json(products)
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, description, price, image, images, categoryId, subcategoryIds, featured, attributes, showcasingSections } = body

    const productData: any = {
      name,
      description,
      price,
      image,
      images: images || [],
      categoryId: categoryId || null,
      featured: featured || false,
      attributes: attributes || null,
      showcasingSections: showcasingSections || [],
    };
    
    // Handle multiple subcategories
    if (subcategoryIds && Array.isArray(subcategoryIds) && subcategoryIds.length > 0) {
      productData.subcategories = {
        create: subcategoryIds.map((catId: string) => ({
          categoryId: catId,
        })),
      };
    }

    let product;
    try {
      product = await db.product.create({
        data: productData,
        include: {
          category: true,
          subcategories: {
            include: {
              category: true,
            },
          },
        },
      });
    } catch (error: any) {
      // If subcategories relation doesn't exist, create without it
      if (error?.message?.includes("subcategories") || error?.code === "P2009" || error?.code === "P2014") {
        const { subcategories: _, ...dataWithoutSubcategories } = productData;
        product = await db.product.create({
          data: dataWithoutSubcategories,
          include: {
            category: true,
          },
        });
      } else {
        throw error;
      }
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Failed to create product:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}

