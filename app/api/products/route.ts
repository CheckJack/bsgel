import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { Prisma } from "@prisma/client"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { logAdminAction, extractRequestInfo } from "@/lib/admin-logger"
import { persistProductMediaFields } from "@/lib/products/persist-media"
import { getProductList } from "@/lib/products/get-product-list"
import { ensureUniqueProductSlug } from "@/lib/products/resolve"

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
    const skipReviews = searchParams.get("skipReviews") === "true"
    const requestedLimit = limitParam ? parseInt(limitParam, 10) : 12
    // Admin product manager asks for up to 1000; shop grids stay small.
    const maxLimit = requestedLimit > 48 ? 1000 : 48

    const showcasingSections = showcasingSectionsParam
      ? showcasingSectionsParam.split(",").map((section) => section.trim()).filter(Boolean)
      : []

    const result = await getProductList({
      categoryId,
      search,
      featured: featured === "true",
      showcasingSection,
      showcasingSections,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      sortBy,
      page: pageParam ? parseInt(pageParam, 10) : 1,
      limit: requestedLimit || 12,
      skipReviews,
      maxLimit,
    })

    const headers = new Headers()
    headers.set("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=120")

    return NextResponse.json(result, { headers })
  } catch (error: any) {
    console.error("Failed to fetch products:", error)
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
        },
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

    productData.slug = await ensureUniqueProductSlug(productData.name, {
      idHint: productData.id,
    });
    
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

    // Move any inline base64 media to disk (keeps product row; only URL fields change)
    try {
      const persisted = await persistProductMediaFields({
        productId: product.id,
        image: product.image,
        images: product.images,
        attributes: product.attributes,
      });
      const needsUpdate =
        persisted.image !== product.image ||
        JSON.stringify(persisted.images) !== JSON.stringify(product.images) ||
        JSON.stringify(persisted.attributes) !== JSON.stringify(product.attributes);
      if (needsUpdate) {
        product = await db.product.update({
          where: { id: product.id },
          data: {
            image: persisted.image ?? null,
            images: persisted.images ?? [],
            attributes:
              persisted.attributes === null || persisted.attributes === undefined
                ? Prisma.JsonNull
                : (persisted.attributes as Prisma.InputJsonValue),
          },
          include: {
            category: true,
            subcategories: {
              include: { category: true },
            },
          },
        });
      }
    } catch (mediaErr) {
      console.error("Failed to persist product media to disk:", mediaErr);
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

