import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    let product;
    try {
      // Try with full schema first
      product = await db.product.findUnique({
        where: { id: params.id },
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
      // If schema doesn't match, use raw SQL to only get fields that exist
      if (error.code === 'P2021' || error.message?.includes('salePrice') || error.message?.includes('does not exist')) {
        console.log("Schema mismatch detected, using raw SQL query");
        const result = await db.$queryRaw`
          SELECT 
            p.id, p.name, p.description, p.price, p.image, p.images, p.featured, p."categoryId", p.attributes, p."showcasingSections",
            p."createdAt", p."updatedAt",
            c.id as "category_id", c.name as "category_name", c.slug as "category_slug"
          FROM "Product" p
          LEFT JOIN "Category" c ON p."categoryId" = c.id
          WHERE p.id = ${params.id}
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
            where: { id: params.id },
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
        } catch (selectError: any) {
          // If select also fails, use raw SQL
          console.log("Select query failed, using raw SQL");
          const result = await db.$queryRaw`
            SELECT 
              p.id, p.name, p.description, p.price, p.image, p.images, p.featured, p."categoryId", p.attributes, p."showcasingSections",
              p."createdAt", p."updatedAt",
              c.id as "category_id", c.name as "category_name", c.slug as "category_slug"
            FROM "Product" p
            LEFT JOIN "Category" c ON p."categoryId" = c.id
            WHERE p.id = ${params.id}
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
    
    let salePriceString = null;
    if (product.salePrice !== null && product.salePrice !== undefined) {
      if (typeof product.salePrice === 'object' && 'toString' in product.salePrice) {
        salePriceString = product.salePrice.toString();
      } else {
        salePriceString = String(product.salePrice);
      }
    }
    
    const serializedProduct = {
      ...product,
      price: priceString,
      salePrice: salePriceString,
    }

    return NextResponse.json(serializedProduct)
  } catch (error: any) {
    console.error("Failed to fetch product:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      params: params.id,
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
  { params }: { params: { id: string } }
) {
  let updateData: any = {}
  
  try {
    const body = await req.json()
    const { name, description, price, image, images, categoryId, subcategoryIds, featured, attributes, showcasingSections } = body

    // Prepare the data object, handling attributes properly
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (image !== undefined) updateData.image = image
    if (images !== undefined) updateData.images = images
    if (featured !== undefined) updateData.featured = featured
    if (showcasingSections !== undefined) updateData.showcasingSections = showcasingSections || []
    
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
    try {
      product = await db.product.update({
        where: { id: params.id },
        data: updateData,
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
      // If schema hasn't been migrated yet, remove subcategories from update and retry
      if (error?.message?.includes("subcategories") || error?.code === "P2021" || error?.code === "P2009" || error?.code === "P2014") {
        const { subcategories, ...dataWithoutSubcategories } = updateData;
        product = await db.product.update({
          where: { id: params.id },
          data: dataWithoutSubcategories,
          include: {
            category: true,
          },
        });
      } else {
        throw error;
      }
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
    
    let salePriceString = null;
    if (product.salePrice !== null && product.salePrice !== undefined) {
      if (typeof product.salePrice === 'object' && 'toString' in product.salePrice) {
        salePriceString = product.salePrice.toString();
      } else {
        salePriceString = String(product.salePrice);
      }
    }
    
    const serializedProduct = {
      ...product,
      price: priceString,
      salePrice: salePriceString,
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
  { params }: { params: { id: string } }
) {
  try {
    await db.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Product deleted" })
  } catch (error) {
    console.error("Failed to delete product:", error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}

