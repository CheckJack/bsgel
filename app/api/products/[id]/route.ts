import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAdminAction, extractRequestInfo, createChangeDetails } from "@/lib/admin-logger"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    let product;
    try {
      // Use select to only get fields that exist in the database
      product = await db.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          images: true,
          featured: true,
          outOfStock: true,
          hemaFree: true,
          categoryId: true,
          attributes: true,
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
      });
      // Add defaults for fields that might not exist in database
      if (product) {
        (product as any).subcategories = [];
      }
    } catch (error: any) {
      // If schema doesn't match, use raw SQL to only get fields that exist
      if (error.code === 'P2021' || error.message?.includes('salePrice') || error.message?.includes('does not exist')) {
        console.log("Schema mismatch detected, using raw SQL query");
        const result = await db.$queryRaw`
          SELECT 
            p.id, p.name, p.description, p.price, p.image, p.images, p.featured, p."outOfStock", p."hemaFree", p."categoryId", p.attributes,
            p."showcasingSections", p."createdAt", p."updatedAt",
            c.id as "category_id", c.name as "category_name", c.slug as "category_slug"
          FROM "Product" p
          LEFT JOIN "Category" c ON p."categoryId" = c.id
          WHERE p.id = ${id}
        `;
        const row = (result as any[])[0];
        if (!row) {
          return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }
          product = {
            id: row.id,
            name: row.name,
            description: row.description,
            price: row.price,
            image: row.image,
            images: row.images || [],
            featured: row.featured,
            outOfStock: row.outOfStock || false,
            hemaFree: row.hemaFree || false,
            categoryId: row.categoryId,
            attributes: row.attributes,
            showcasingSections: row.showcasingSections || [],
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            category: row.category_id ? {
              id: row.category_id,
              name: row.category_name,
              slug: row.category_slug,
            } : null,
            subcategories: [],
          };
      } else {
        // If it's a different error, try simpler query with select to avoid schema issues
        console.log("Trying simpler query with select");
        try {
          product = await db.product.findUnique({
            where: { id },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image: true,
              images: true,
              featured: true,
              outOfStock: true,
              hemaFree: true,
              categoryId: true,
              attributes: true,
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
          });
        } catch (selectError: any) {
          // If select also fails, use raw SQL
          console.log("Select query failed, using raw SQL");
          const result = await db.$queryRaw`
            SELECT 
              p.id, p.name, p.description, p.price, p.image, p.images, p.featured, p."outOfStock", p."hemaFree", p."categoryId", p.attributes,
              p."showcasingSections", p."createdAt", p."updatedAt",
              c.id as "category_id", c.name as "category_name", c.slug as "category_slug"
            FROM "Product" p
            LEFT JOIN "Category" c ON p."categoryId" = c.id
            WHERE p.id = ${id}
          `;
          const row = (result as any[])[0];
          if (!row) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
          }
          product = {
            id: row.id,
            name: row.name,
            description: row.description,
            price: row.price,
            image: row.image,
            images: row.images || [],
            featured: row.featured,
            outOfStock: row.outOfStock || false,
            hemaFree: row.hemaFree || false,
            categoryId: row.categoryId,
            attributes: row.attributes,
            showcasingSections: row.showcasingSections || [],
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            category: row.category_id ? {
              id: row.category_id,
              name: row.category_name,
              slug: row.category_slug,
            } : null,
            subcategories: [],
          };
        }
      }
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Calculate review stats for this product
    let reviewCount = 0;
    let rating = 0;
    try {
      const reviewStats = await db.productReview.aggregate({
        where: {
          productId: id,
          status: 'APPROVED',
        },
        _count: {
          id: true,
        },
        _avg: {
          rating: true,
        },
      });
      reviewCount = reviewStats._count.id || 0;
      rating = reviewStats._avg.rating || 0;
    } catch (error) {
      console.warn("Failed to fetch review stats:", error);
      // Continue with defaults (0)
    }

    // Serialize Decimal fields to strings for JSON response
    // Handle Decimal type conversion safely
    let priceString = '0';
    if (product.price !== null && product.price !== undefined) {
      if (typeof product.price === 'object' && 'toString' in product.price) {
        priceString = product.price.toString();
      } else {
        priceString = String(product.price);
      }
    }
    
    // salePrice doesn't exist in database, return null
    const serializedProduct = {
      ...product,
      price: priceString,
      salePrice: null, // Field doesn't exist in database
      discountPercentage: null, // Field doesn't exist in database
      rating: rating,
      reviewCount: reviewCount,
    }

    // Add caching headers for better performance (cache for 5 minutes)
    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return NextResponse.json(serializedProduct, { headers })
  } catch (error: any) {
    const { id: productId } = await params
    console.error("Failed to fetch product:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      params: productId,
    })
    return NextResponse.json(
      { 
        error: "Failed to fetch product",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let updateData: any = {}
  
  try {
    // Check authentication for admin actions
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "ADMIN";
    
    // Always get product before update for logging (if admin)
    let productBefore = null;
    if (isAdmin && session?.user?.id) {
      try {
        productBefore = await db.product.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            images: true,
            featured: true,
            categoryId: true,
            attributes: true,
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
        });
        if (productBefore) {
          (productBefore as any).subcategories = [];
        }
        console.log("📋 Product before update fetched:", productBefore ? "YES" : "NO");
      } catch (error: any) {
        console.error("Error fetching product before update:", error);
        productBefore = null;
      }
    }

    const body = await req.json()
    const { id: newId, name, description, price, image, images, categoryId, subcategoryIds, featured, outOfStock, hemaFree, attributes, showcasingSections } = body

    // Handle ID change - must check for duplicates first
    if (newId !== undefined && typeof newId === "string" && newId.trim().length > 0) {
      const trimmedNewId = newId.trim();
      
      // Only check for duplicates if the ID is actually changing
      if (trimmedNewId !== id) {
        // Check if the new ID already exists
        const existingProduct = await db.product.findUnique({
          where: { id: trimmedNewId },
        });
        
        if (existingProduct) {
          return NextResponse.json(
            { error: "A product with this ID already exists. Please use a different ID." },
            { status: 400 }
          );
        }
      }
    }

    // Prepare the data object, handling attributes properly
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (image !== undefined) updateData.image = image
    if (images !== undefined) updateData.images = images
    if (featured !== undefined) updateData.featured = featured
    // Product tags are mutually exclusive - only one can be set at a time
    // Only add these fields if columns exist in database (will be removed if they don't exist)
    if (outOfStock !== undefined) {
      updateData.outOfStock = outOfStock
    }
    if (hemaFree !== undefined) {
      updateData.hemaFree = hemaFree
    }
    if (showcasingSections !== undefined) updateData.showcasingSections = Array.isArray(showcasingSections) ? showcasingSections : []
    
    // Handle categoryId using relation syntax (required for updates in some Prisma versions)
    if (categoryId !== undefined) {
      if (categoryId === null || categoryId === "") {
        updateData.category = { disconnect: true }
      } else {
        updateData.category = { connect: { id: categoryId } }
      }
    }
    
    // Handle multiple subcategories
    if (subcategoryIds !== undefined) {
      if (Array.isArray(subcategoryIds)) {
        // Delete all existing subcategories and create new ones
        updateData.subcategories = {
          deleteMany: {},
          create: subcategoryIds.filter((id: string) => id).map((catId: string) => ({
            categoryId: catId,
          })),
        };
      } else if (subcategoryIds === null) {
        // Remove all subcategories
        updateData.subcategories = {
          deleteMany: {},
        };
      }
    }
    
    // Handle attributes: if it's null or empty object, set to null, otherwise set the value
    if (attributes !== undefined) {
      if (attributes === null || (typeof attributes === 'object' && Object.keys(attributes).length === 0)) {
        // Set to Prisma.JsonNull for JSON fields when setting to null
        updateData.attributes = Prisma.JsonNull
      } else {
        // Ensure it's a valid JSON object - cast to Prisma.InputJsonValue
        updateData.attributes = attributes as Prisma.InputJsonValue
      }
    }

    console.log("Updating product with data:", JSON.stringify(updateData, null, 2))

    let product;
    
    // Handle ID change separately using a transaction
    if (newId !== undefined && typeof newId === "string" && newId.trim().length > 0) {
      const trimmedNewId = newId.trim();
      if (trimmedNewId !== id) {
        // ID is changing - need to use raw SQL to update ID and all foreign key references
        try {
          await db.$transaction(async (tx) => {
            // First, get the current product data (only scalar fields, no relations)
            const currentProduct = await tx.product.findUnique({
              where: { id },
              select: {
                name: true,
                description: true,
                price: true,
                image: true,
                images: true,
                featured: true,
                outOfStock: true,
                hemaFree: true,
                categoryId: true,
                attributes: true,
                showcasingSections: true,
              },
            });
            
            if (!currentProduct) {
              throw new Error("Product not found");
            }
            
            // Prepare product data, excluding relation syntax from updateData
            const { category: categoryRelation, subcategories: subcategoriesRelation, ...updateDataScalars } = updateData;
            
            // Merge current product with updated scalar fields (only scalar fields, no relations)
            const newProductData: any = {
              id: trimmedNewId,
              name: updateDataScalars.name ?? currentProduct.name,
              description: updateDataScalars.description ?? currentProduct.description,
              price: updateDataScalars.price ?? currentProduct.price,
              image: updateDataScalars.image ?? currentProduct.image,
              images: updateDataScalars.images ?? currentProduct.images,
              featured: updateDataScalars.featured ?? currentProduct.featured,
              outOfStock: updateDataScalars.outOfStock ?? currentProduct.outOfStock,
              hemaFree: updateDataScalars.hemaFree ?? currentProduct.hemaFree,
              categoryId: categoryId !== undefined ? (categoryId || null) : currentProduct.categoryId,
              attributes: updateDataScalars.attributes ?? currentProduct.attributes,
              showcasingSections: updateDataScalars.showcasingSections ?? currentProduct.showcasingSections,
            };
            
            // Create new product with new ID (only scalar fields, no relation syntax)
            await tx.product.create({
              data: newProductData,
            });
            
            // Update all foreign key references
            // Update CartItem
            await tx.cartItem.updateMany({
              where: { productId: id },
              data: { productId: trimmedNewId },
            });
            
            // Update OrderItem
            await tx.orderItem.updateMany({
              where: { productId: id },
              data: { productId: trimmedNewId },
            });
            
            // Update ProductReview
            await tx.productReview.updateMany({
              where: { productId: id },
              data: { productId: trimmedNewId },
            });
            
            // Update ProductSubcategory
            await tx.productSubcategory.updateMany({
              where: { productId: id },
              data: { productId: trimmedNewId },
            });
            
            // Update TrainingProgramProduct
            await tx.trainingProgramProduct.updateMany({
              where: { productId: id },
              data: { productId: trimmedNewId },
            });
            
            // Delete old product
            await tx.product.delete({
              where: { id },
            });
          });
          
          // Fetch the updated product with new ID
          product = await db.product.findUnique({
            where: { id: trimmedNewId },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image: true,
              images: true,
              featured: true,
              outOfStock: true,
              hemaFree: true,
              categoryId: true,
              attributes: true,
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
          });
          (product as any).subcategories = [];
        } catch (txError: any) {
          console.error("Transaction error updating product ID:", txError);
          throw new Error(`Failed to update product ID: ${txError.message}`);
        }
      } else {
        // ID not changing, do regular update
        // Remove ID from updateData if present
        const { id: _, ...updateDataWithoutId } = updateData;
        try {
          product = await db.product.update({
            where: { id: id },
            data: updateDataWithoutId,
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image: true,
              images: true,
              featured: true,
              outOfStock: true,
              hemaFree: true,
              categoryId: true,
              attributes: true,
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
          });
          // Add defaults for fields that might not exist in database
          (product as any).subcategories = [];
        } catch (error: any) {
          // If schema hasn't been migrated yet, remove fields that don't exist and retry
          if (error?.message?.includes("subcategories") || error?.message?.includes("outOfStock") || error?.message?.includes("hemaFree") || error?.message?.includes("showcasingSections") || error?.code === "P2021" || error?.code === "P2022" || error?.code === "P2009" || error?.code === "P2014") {
            // Remove fields that don't exist in database
            const { subcategories, outOfStock, hemaFree, showcasingSections, ...dataWithoutMissingFields } = updateDataWithoutId;
            try {
              product = await db.product.update({
                where: { id: id },
                data: dataWithoutMissingFields,
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  image: true,
                  images: true,
                  featured: true,
                  outOfStock: true,
                  hemaFree: true,
                  categoryId: true,
                  attributes: true,
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
              });
              // Add defaults for missing fields
              (product as any).subcategories = [];
            } catch (retryError: any) {
              // If still failing, try with even fewer fields
              const { attributes, ...dataMinimal } = dataWithoutMissingFields;
              product = await db.product.update({
                where: { id: id },
                data: dataMinimal,
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  image: true,
                  images: true,
                  featured: true,
                  outOfStock: true,
                  hemaFree: true,
                  categoryId: true,
                  attributes: true,
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
              });
              (product as any).subcategories = [];
            }
          } else {
            throw error;
          }
        }
      }
    } else {
      // No ID provided in request, do regular update
      // Remove ID from updateData if present
      const { id: _, ...updateDataWithoutId } = updateData;
      try {
        product = await db.product.update({
          where: { id: id },
          data: updateDataWithoutId,
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            images: true,
            featured: true,
            outOfStock: true,
            hemaFree: true,
            categoryId: true,
            attributes: true,
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
        });
        // Add defaults for fields that might not exist in database
        (product as any).subcategories = [];
      } catch (error: any) {
        // If schema hasn't been migrated yet, remove fields that don't exist and retry
        if (error?.message?.includes("subcategories") || error?.message?.includes("outOfStock") || error?.message?.includes("hemaFree") || error?.message?.includes("showcasingSections") || error?.code === "P2021" || error?.code === "P2022" || error?.code === "P2009" || error?.code === "P2014") {
          // Remove fields that don't exist in database
          const { subcategories, outOfStock, hemaFree, showcasingSections, ...dataWithoutMissingFields } = updateDataWithoutId;
          try {
            product = await db.product.update({
              where: { id: id },
              data: dataWithoutMissingFields,
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image: true,
                images: true,
                featured: true,
                outOfStock: true,
                hemaFree: true,
                categoryId: true,
                attributes: true,
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
            });
            // Add defaults for missing fields
            (product as any).subcategories = [];
          } catch (retryError: any) {
            // If still failing, try with even fewer fields
            const { attributes, ...dataMinimal } = dataWithoutMissingFields;
            product = await db.product.update({
              where: { id: id },
              data: dataMinimal,
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image: true,
                images: true,
                featured: true,
                outOfStock: true,
                hemaFree: true,
                categoryId: true,
                attributes: true,
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
            });
            (product as any).subcategories = [];
          }
        } else {
          throw error;
        }
      }
    }

    // Ensure product was created/updated
    if (!product) {
      throw new Error("Failed to update product - product is null");
    }

    // Serialize Decimal fields to strings for JSON response
    // Handle Decimal type conversion safely
    let priceString = '0';
    if (product.price !== null && product.price !== undefined) {
      if (typeof product.price === 'object' && 'toString' in product.price) {
        priceString = product.price.toString();
      } else {
        priceString = String(product.price);
      }
    }
    
    // salePrice doesn't exist in database
    const serializedProduct = {
      ...product,
      price: priceString,
      salePrice: null, // Field doesn't exist in database
      discountPercentage: null, // Field doesn't exist in database
    }

    // Log admin action - ALWAYS log if admin (even if productBefore fetch failed)
    if (isAdmin && session?.user?.id) {
      console.log("🔵 LOGGING CHECK:", {
        isAdmin,
        hasSession: !!session,
        userId: session.user.id,
        hasProductBefore: !!productBefore,
        productId: product.id,
        productName: product.name,
      });

      try {
        const { ipAddress, userAgent } = extractRequestInfo(req);
        const logResult = await logAdminAction({
          userId: session.user.id!,
          actionType: "UPDATE" as any,
          resourceType: "Product",
          resourceId: id,
          description: `Updated product "${product.name}"`,
          details: productBefore ? createChangeDetails(productBefore, product) : { after: product },
          ipAddress,
          userAgent,
          metadata: {
            url: req.url,
            method: "PATCH",
          },
        });

        if (!logResult) {
          console.error("⚠️ Failed to log product update - check console for details");
        } else {
          console.log("✅ Successfully logged product update");
        }
      } catch (logError: any) {
        console.error("❌ Exception during logging:", logError);
      }
    } else {
      console.log("⚠️ NOT LOGGING - isAdmin:", isAdmin, "hasSession:", !!session, "userId:", session?.user?.id);
    }

    return NextResponse.json(serializedProduct)
  } catch (error: any) {
    console.error("Failed to update product:", error)
    console.error("Error code:", error?.code)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    console.error("Update data attempted:", JSON.stringify(updateData, null, 2))
    
    // Ensure we always return valid JSON
    const errorResponse = {
      error: "Failed to update product",
      details: error?.message || "Unknown error",
      code: error?.code || "UNKNOWN",
      meta: error?.meta || null
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Get product before deletion for logging
    const product = await db.product.findUnique({
      where: { id: id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await db.product.delete({
      where: { id: id },
    })

    // Log admin action
    const { ipAddress, userAgent } = extractRequestInfo(req);
    await logAdminAction({
      userId: session.user.id!,
      actionType: "DELETE" as any,
      resourceType: "Product",
      resourceId: id,
      description: `Deleted product "${product.name}"`,
      details: {
        before: product,
      },
      ipAddress,
      userAgent,
      metadata: {
        url: req.url,
        method: "DELETE",
      },
    });

    return NextResponse.json({ message: "Product deleted" })
  } catch (error) {
    console.error("Failed to delete product:", error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}

