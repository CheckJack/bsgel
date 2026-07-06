import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { logAdminAction, extractRequestInfo } from "@/lib/admin-logger"
import { PRODUCT_LIST_SELECT, attachReviewStats } from "@/lib/products/list-select"
import { sanitizeProductList } from "@/lib/products/list-images"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get("categoryId")
    const search = searchParams.get("search")
    const featured = searchParams.get("featured")
    const showcasingSection = searchParams.get("showcasingSection")
    const showcasingSectionsParam = searchParams.get("showcasingSections")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sortBy = searchParams.get("sortBy") || "newest"
    const pageParam = searchParams.get("page")
    const limitParam = searchParams.get("limit")
    
    // Always use pagination with reasonable defaults to prevent loading all products
    const page = pageParam ? parseInt(pageParam) : 1
    const limit = limitParam ? parseInt(limitParam) : 12
    const usePagination = true // Always use pagination for performance

    const where: any = {}
    const normalizedSearch = search?.trim() || ""
    const normalizedSearchLower = normalizedSearch.toLowerCase()
    const compactSearch = normalizedSearchLower.replace(/\s+/g, "")
    const searchTerms = normalizedSearch
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 2)
    const searchTokens = Array.from(new Set(searchTerms))
    const isSearchRequest = searchTokens.length > 0

    const getRelevanceScore = (product: any) => {
      if (!isSearchRequest) return 0

      const name = (product?.name || "").toLowerCase()
      const description = (product?.description || "").toLowerCase()
      const productId = (product?.id || "").toLowerCase()
      const categoryName = (product?.category?.name || "").toLowerCase()
      const categorySlug = (product?.category?.slug || "").toLowerCase()
      const compactName = name.replace(/\s+/g, "")

      let score = 0

      if (name === normalizedSearchLower) score += 1000
      if (name.startsWith(normalizedSearchLower)) score += 700
      if (name.includes(normalizedSearchLower)) score += 500
      if (compactSearch && compactName.includes(compactSearch)) score += 350

      for (const token of searchTokens) {
        if (name.startsWith(token)) score += 140
        if (name.includes(token)) score += 100
        if (description.includes(token)) score += 50
        if (productId.includes(token)) score += 35
        if (categoryName.includes(token) || categorySlug.includes(token)) score += 25
      }

      return score
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (searchTokens.length > 0) {
      // Better search intent:
      // - single-term query => broad OR matching
      // - multi-term query => each term must match somewhere (AND of OR groups)
      const tokenClauses = searchTokens.map((token) => ({
        OR: [
          { name: { contains: token, mode: "insensitive" } },
          { description: { contains: token, mode: "insensitive" } },
          { id: { contains: token, mode: "insensitive" } },
          { category: { name: { contains: token, mode: "insensitive" } } },
          { category: { slug: { contains: token, mode: "insensitive" } } },
        ],
      }));

      if (searchTokens.length === 1) {
        where.OR = tokenClauses[0].OR;
      } else {
        where.AND = [...(where.AND || []), ...tokenClauses];
      }
    }

    if (featured === "true") {
      where.featured = true
    }

    // Filter by showcasing section
    if (showcasingSection) {
      where.showcasingSections = {
        has: showcasingSection
      }
    } else if (showcasingSectionsParam) {
      const sections = showcasingSectionsParam
        .split(",")
        .map((section) => section.trim())
        .filter(Boolean)
      if (sections.length > 0) {
        where.showcasingSections = { hasSome: sections }
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

    const skipReviews = searchParams.get("skipReviews") === "true"
    const listQuery = {
      where,
      select: PRODUCT_LIST_SELECT,
      orderBy,
      skip: isSearchRequest ? 0 : (page - 1) * limit,
      take: isSearchRequest ? 500 : limit,
    }

    let products: any[]
    let total: number | undefined

    try {
      const [fetchedProducts, fetchedTotal] = await Promise.all([
        db.product.findMany(listQuery),
        db.product.count({ where }),
      ])
      products = fetchedProducts
      total = fetchedTotal

      if (!skipReviews && products.length > 0) {
        products = await attachReviewStats(db, products)
      } else if (products.length > 0) {
        products = products.map((product) => ({
          ...product,
          reviewCount: 0,
          rating: 0,
        }))
      }
    } catch (error: any) {
      // If schema hasn't been migrated yet, use simpler query without subcategory
      try {
        console.log("Subcategory relation not available, using fallback query");
        products = await db.product.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            salePrice: true,
            image: true,
            images: true,
            featured: true,
            outOfStock: true,
            stockQuantity: true,
            hemaFree: true,
            categoryId: true,
            showcasingSections: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy,
          skip: isSearchRequest ? 0 : (page - 1) * limit,
          take: isSearchRequest ? 500 : limit,
        });
        
        // Add review stats for fallback query too
        if (products.length > 0) {
          const productIds = products.map((p: any) => p.id);
          try {
            const reviewStats = await db.$queryRaw<Array<{ productId: string; reviewCount: bigint; avgRating: number }>>`
              SELECT 
                "productId",
                COUNT(*)::int as "reviewCount",
                COALESCE(AVG(rating)::float, 0) as "avgRating"
              FROM "ProductReview"
              WHERE "productId" = ANY(${productIds}::text[])
                AND status = 'APPROVED'
              GROUP BY "productId"
            `;

            const statsMap = new Map(
              reviewStats.map(stat => [
                stat.productId,
                {
                  reviewCount: Number(stat.reviewCount),
                  rating: Number(stat.avgRating),
                }
              ])
            );

            products = products.map((product: any) => ({
              ...product,
              reviewCount: statsMap.get(product.id)?.reviewCount || 0,
              rating: statsMap.get(product.id)?.rating || 0,
            }));
          } catch (reviewError) {
            // If review stats fail, just set defaults
            products = products.map((product: any) => ({
              ...product,
              reviewCount: 0,
              rating: 0,
            }));
          }
        }
      } catch (fallbackError: any) {
        // If Prisma still fails (e.g., missing columns), use raw SQL
        console.log("Prisma query failed, using raw SQL fallback");
        // Use raw SQL but only select columns that definitely exist
        // Don't select outOfStock, hemaFree, or showcasingSections if they might not exist
        // We'll set them to defaults in the mapping
        let sqlQuery = `
          SELECT 
              p.id, p.name, p.description, p.price, p."salePrice", p.image, p.images, p.featured, p."categoryId",
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

        if (searchTokens.length > 0) {
          const tokenClauses: string[] = [];
          for (const token of searchTokens) {
            tokenClauses.push(`(
              LOWER(p.name) LIKE $${paramIndex}
              OR LOWER(COALESCE(p.description, '')) LIKE $${paramIndex}
              OR LOWER(COALESCE(c.name, '')) LIKE $${paramIndex}
              OR LOWER(COALESCE(c.slug, '')) LIKE $${paramIndex}
              OR LOWER(p.id) LIKE $${paramIndex}
            )`);
            params.push(`%${token.toLowerCase()}%`);
            paramIndex++;
          }
          const joinOperator = searchTokens.length > 1 ? " AND " : " OR ";
          sqlQuery += ` AND (${tokenClauses.join(joinOperator)})`;
        }

        if (featured === "true") {
          sqlQuery += ` AND p.featured = true`;
        }

        // Filter by showcasing section (only if column exists - skip if it doesn't)
        // Note: This filter will be skipped if showcasingSections column doesn't exist
        // The query will still work but won't filter by showcasing section
        // if (showcasingSection) {
        //   sqlQuery += ` AND $${paramIndex} = ANY(p."showcasingSections")`;
        //   params.push(showcasingSection);
        //   paramIndex++;
        // }

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

        // Always add pagination for performance
        sqlQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, (page - 1) * limit);

        const rawProducts = await db.$queryRawUnsafe(sqlQuery, ...params) as any[];
        
        // Transform raw SQL results to match expected format
        // Set defaults for columns that might not exist in database
        products = rawProducts.map((row: any) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          price: row.price,
          salePrice: row.salePrice || null,
          image: row.image,
          images: Array.isArray(row.images) ? row.images : (row.images ? [row.images] : []),
          featured: row.featured,
          outOfStock: false, // Default since column might not exist
          hemaFree: false, // Default since column might not exist
          categoryId: row.categoryId,
          showcasingSections: [], // Default since column might not exist
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          category: row.category_id ? {
            id: row.category_id,
            name: row.category_name,
          } : null,
        }));

        // Calculate review stats for raw SQL products using optimized query
        if (products.length > 0) {
          const productIds = products.map((p: any) => p.id);
          try {
            const reviewStats = await db.productReview.groupBy({
              by: ['productId'],
              where: {
                productId: { in: productIds },
                status: 'APPROVED',
              },
              _count: {
                id: true,
              },
              _avg: {
                rating: true,
              },
            });

            const statsMap = new Map(
              reviewStats.map(stat => [
                stat.productId,
                {
                  reviewCount: stat._count.id,
                  rating: stat._avg.rating || 0,
                }
              ])
            );

            products = products.map((product: any) => ({
              ...product,
              reviewCount: statsMap.get(product.id)?.reviewCount || 0,
              rating: statsMap.get(product.id)?.rating || 0,
            }));
          } catch (error) {
            // If review stats fail, just set defaults
            products = products.map((product: any) => ({
              ...product,
              reviewCount: 0,
              rating: 0,
            }));
          }
        }
      }
    }

    if (typeof total !== "number") {
      try {
        total = await db.product.count({ where })
      } catch {
        total = Array.isArray(products) ? products.length : 0
      }
    }

    if (isSearchRequest && Array.isArray(products)) {
      products = [...products]
        .sort((a: any, b: any) => {
          const scoreDiff = getRelevanceScore(b) - getRelevanceScore(a)
          if (scoreDiff !== 0) return scoreDiff
          const aCreated = new Date(a?.createdAt || 0).getTime()
          const bCreated = new Date(b?.createdAt || 0).getTime()
          return bCreated - aCreated
        })
        .slice((page - 1) * limit, page * limit)
    }

    // Always return paginated response for consistency and performance
    const totalPages = Math.ceil((total ?? 0) / limit)

    const listProducts = Array.isArray(products)
      ? sanitizeProductList(products)
      : products

    // Add caching headers for better performance (cache for 60 seconds)
    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return NextResponse.json({
      products: listProducts,
      pagination: {
        page,
        limit,
        total: total ?? 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }, { headers })
  } catch (error: any) {
    console.error("Failed to fetch products:", error)
    // Return a more helpful error response
    return NextResponse.json(
      { 
        error: "Failed to fetch products",
        message: error?.message || "Unknown error",
        products: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json()
    const { id, name, description, price, salePrice, image, images, categoryId, subcategoryIds, featured, outOfStock, hemaFree, attributes, showcasingSections, stockQuantity } = body

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    if (price === undefined || price === null || isNaN(parseFloat(price))) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 }
      );
    }

    // Convert price to number (Prisma accepts string or number for Decimal)
    const priceValue = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(priceValue) || priceValue < 0) {
      return NextResponse.json(
        { error: "Price must be a valid positive number" },
        { status: 400 }
      );
    }

    // Handle salePrice conversion
    let salePriceValue = null;
    if (salePrice !== undefined && salePrice !== null) {
      salePriceValue = typeof salePrice === "string" ? parseFloat(salePrice) : salePrice;
      if (isNaN(salePriceValue) || salePriceValue < 0) {
        return NextResponse.json(
          { error: "Sale price must be a valid positive number" },
          { status: 400 }
        );
      }
    }

    const productData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      price: priceValue, // Prisma will handle Decimal conversion
      salePrice: salePriceValue,
      image: image || null,
      images: Array.isArray(images) ? images : [],
      categoryId: categoryId || null,
      featured: featured === true,
      stockQuantity:
        stockQuantity !== undefined && stockQuantity !== null
          ? Math.max(0, parseInt(String(stockQuantity), 10) || 0)
          : outOfStock === true
            ? 0
            : 999,
      outOfStock:
        stockQuantity !== undefined && stockQuantity !== null
          ? Math.max(0, parseInt(String(stockQuantity), 10) || 0) <= 0
          : outOfStock === true,
      hemaFree: hemaFree === true,
      attributes: attributes || null,
      showcasingSections: Array.isArray(showcasingSections) ? showcasingSections : [],
    };

    // If an ID is provided, use it (validate it's a non-empty string)
    if (id && typeof id === "string" && id.trim().length > 0) {
      const trimmedId = id.trim();
      
      // Check if the ID already exists
      const existingProduct = await db.product.findUnique({
        where: { id: trimmedId },
      });
      
      if (existingProduct) {
        return NextResponse.json(
          { error: "A product with this ID already exists. Please use a different ID." },
          { status: 400 }
        );
      }
      
      productData.id = trimmedId;
    }
    
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
      console.error("Prisma error creating product:", {
        error: error.message,
        code: error.code,
        meta: error.meta,
        productData: { ...productData, price: priceValue },
      });
      
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
        // Re-throw to be caught by outer catch block which will return detailed error
        throw error;
      }
    }

    // Log admin action - ALWAYS log for admin users
    if (session?.user?.id) {
      console.log("🔵 LOGGING PRODUCT CREATION:", {
        userId: session.user.id,
        productId: product.id,
        productName: product.name,
      });

      try {
        const { ipAddress, userAgent } = extractRequestInfo(req);
        const logResult = await logAdminAction({
          userId: session.user.id!,
          actionType: "CREATE" as any,
          resourceType: "Product",
          resourceId: product.id,
          description: `Created product "${product.name}"`,
          details: {
            after: product,
          },
          ipAddress,
          userAgent,
          metadata: {
            url: req.url,
            method: "POST",
          },
        });

        if (!logResult) {
          console.error("⚠️ Failed to log product creation - check console for details");
        } else {
          console.log("✅ Successfully logged product creation");
        }
      } catch (logError: any) {
        console.error("❌ Exception during logging:", logError);
      }
    } else {
      console.log("⚠️ NOT LOGGING PRODUCT CREATION - No session or userId");
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create product:", {
      error: error?.message || error,
      stack: error?.stack,
      code: error?.code,
      meta: error?.meta,
    });
    
    return NextResponse.json(
      { 
        error: "Failed to create product",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

