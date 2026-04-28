import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { productIds, updates } = body

    // Validate input
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "Product IDs array is required" },
        { status: 400 }
      )
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Updates object is required" },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {}

    // Handle categoryId
    if (updates.categoryId !== undefined) {
      if (updates.categoryId === null || updates.categoryId === "") {
        updateData.category = { disconnect: true }
      } else {
        // Verify category exists
        const category = await db.category.findUnique({
          where: { id: updates.categoryId },
        })
        if (!category) {
          return NextResponse.json(
            { error: "Category not found" },
            { status: 404 }
          )
        }
        updateData.category = { connect: { id: updates.categoryId } }
      }
    }

    // Handle featured status
    if (updates.featured !== undefined) {
      updateData.featured = Boolean(updates.featured)
    }

    // Handle outOfStock status - mutually exclusive with hemaFree
    // Only add if columns exist (will be removed if they don't exist in error handler)
    if (updates.outOfStock !== undefined) {
      updateData.outOfStock = Boolean(updates.outOfStock)
    }

    // Handle hemaFree status - mutually exclusive with outOfStock
    // Only add if columns exist (will be removed if they don't exist in error handler)
    if (updates.hemaFree !== undefined) {
      updateData.hemaFree = Boolean(updates.hemaFree)
    }

    // Handle price (if provided)
    if (updates.price !== undefined && updates.price !== null && updates.price !== "") {
      updateData.price = parseFloat(updates.price)
    }

    // Handle salePrice (discount price) (if provided)
    if (updates.salePrice !== undefined && updates.salePrice !== null && updates.salePrice !== "") {
      const salePrice = parseFloat(updates.salePrice);
      if (isNaN(salePrice) || salePrice < 0) {
        return NextResponse.json(
          { error: "Invalid sale price. Must be a valid positive number." },
          { status: 400 }
        );
      }
      updateData.salePrice = salePrice;
    }

    // Handle showcasingSections (if provided)
    if (updates.showcasingSections !== undefined) {
      updateData.showcasingSections = Array.isArray(updates.showcasingSections) ? updates.showcasingSections : []
    }

    // Handle subcategoryIds (if provided)
    let needsSubcategoryUpdate = false
    if (updates.subcategoryIds !== undefined && Array.isArray(updates.subcategoryIds)) {
      needsSubcategoryUpdate = true
      
      // Validate that all subcategory IDs exist and are actually subcategories
      if (updates.subcategoryIds.length > 0) {
        const subcategories = await db.category.findMany({
          where: {
            id: { in: updates.subcategoryIds },
            parentId: { not: null }, // Ensure they are subcategories
          },
        })
        
        if (subcategories.length !== updates.subcategoryIds.length) {
          return NextResponse.json(
            { error: "One or more subcategories not found or invalid" },
            { status: 400 }
          )
        }
      }
    }

    // If no valid updates, return error
    if (Object.keys(updateData).length === 0 && !needsSubcategoryUpdate) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      )
    }

    // Perform bulk update
    // Note: Prisma's updateMany doesn't support relations (category connect/disconnect, subcategories)
    // So we need to update each product individually if category or subcategories are being updated
    if (updateData.category || needsSubcategoryUpdate) {
      // Update each product individually to handle category and subcategory relations
      const updatePromises = productIds.map(async (id: string) => {
        // Prepare product update data
        const productUpdate: any = {}
        
        // Copy non-relation fields
        if (updateData.featured !== undefined) productUpdate.featured = updateData.featured
        if (updateData.outOfStock !== undefined) {
          productUpdate.outOfStock = updateData.outOfStock
        }
        if (updateData.hemaFree !== undefined) {
          productUpdate.hemaFree = updateData.hemaFree
        }
        if (updateData.price !== undefined) productUpdate.price = updateData.price
        if (updateData.salePrice !== undefined) productUpdate.salePrice = updateData.salePrice
        if (updateData.showcasingSections !== undefined) productUpdate.showcasingSections = updateData.showcasingSections
        
        // Update product with non-relation fields first
        if (Object.keys(productUpdate).length > 0) {
          try {
            await db.product.update({
              where: { id },
              data: productUpdate,
            })
          } catch (error: any) {
            // If columns don't exist, remove them and retry
            if (error?.message?.includes("outOfStock") || error?.message?.includes("hemaFree") || error?.message?.includes("showcasingSections") || error?.code === "P2022") {
              const { outOfStock, hemaFree, showcasingSections, ...productUpdateWithoutMissing } = productUpdate;
              if (Object.keys(productUpdateWithoutMissing).length > 0) {
                await db.product.update({
                  where: { id },
                  data: productUpdateWithoutMissing,
                })
              }
              // If showcasingSections was removed, try to update it separately
              if (productUpdate.showcasingSections !== undefined && !productUpdateWithoutMissing.showcasingSections) {
                try {
                  await db.product.update({
                    where: { id },
                    data: { showcasingSections: productUpdate.showcasingSections },
                  })
                } catch (e) {
                  // If it still fails, just log and continue
                  console.warn(`Failed to update showcasingSections for product ${id}:`, e)
                }
              }
            } else {
              throw error;
            }
          }
        }

        // Handle category relation
        if (updateData.category) {
          await db.product.update({
            where: { id },
            data: { category: updateData.category },
          })
        }

        // Handle subcategories
        if (needsSubcategoryUpdate) {
          // Delete all existing subcategories for this product
          await db.productSubcategory.deleteMany({
            where: { productId: id },
          })

          // Create new subcategory associations
          if (updates.subcategoryIds && updates.subcategoryIds.length > 0) {
            await db.productSubcategory.createMany({
              data: updates.subcategoryIds.map((subcategoryId: string) => ({
                productId: id,
                categoryId: subcategoryId,
              })),
              skipDuplicates: true,
            })
          }
        }
      })
      
      await Promise.all(updatePromises)
      
      return NextResponse.json({
        message: "Products updated successfully",
        count: productIds.length,
      })
    } else {
      // For non-relation updates, we can use updateMany for better performance
      try {
        const result = await db.product.updateMany({
          where: {
            id: {
              in: productIds,
            },
          },
          data: updateData,
        })

        return NextResponse.json({
          message: "Products updated successfully",
          count: result.count,
        })
      } catch (error: any) {
        // If columns don't exist, remove them and retry
        if (error?.message?.includes("outOfStock") || error?.message?.includes("hemaFree") || error?.message?.includes("showcasingSections") || error?.code === "P2022") {
          const { outOfStock, hemaFree, showcasingSections, ...updateDataWithoutMissing } = updateData;
          if (Object.keys(updateDataWithoutMissing).length > 0) {
            const result = await db.product.updateMany({
              where: {
                id: {
                  in: productIds,
                },
              },
              data: updateDataWithoutMissing,
            })
            // If showcasingSections was removed, try to update it separately
            if (updateData.showcasingSections !== undefined && !updateDataWithoutMissing.showcasingSections) {
              try {
                await db.product.updateMany({
                  where: {
                    id: {
                      in: productIds,
                    },
                  },
                  data: { showcasingSections: updateData.showcasingSections },
                })
              } catch (e) {
                // If it still fails, just log and continue
                console.warn("Failed to update showcasingSections:", e)
              }
            }
            return NextResponse.json({
              message: "Products updated successfully (some fields skipped due to missing columns)",
              count: result.count,
            })
          } else {
            // If only showcasingSections remains, try to update it
            if (updateData.showcasingSections !== undefined) {
              try {
                const result = await db.product.updateMany({
                  where: {
                    id: {
                      in: productIds,
                    },
                  },
                  data: { showcasingSections: updateData.showcasingSections },
                })
                return NextResponse.json({
                  message: "Products updated successfully",
                  count: result.count,
                })
              } catch (e) {
                return NextResponse.json(
                  {
                    error: "No valid updates provided (all fields require missing database columns)",
                    details: "The showcasingSections column does not exist in the database. Please run migrations.",
                  },
                  { status: 400 }
                )
              }
            }
            return NextResponse.json(
              {
                error: "No valid updates provided (all fields require missing database columns)",
                details: "The outOfStock, hemaFree, and showcasingSections columns do not exist in the database. Please run migrations.",
              },
              { status: 400 }
            )
          }
        } else {
          throw error;
        }
      }
    }
  } catch (error: any) {
    console.error("Failed to bulk update products:", error)
    return NextResponse.json(
      {
        error: "Failed to bulk update products",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { productIds } = body

    // Validate input
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "Product IDs array is required" },
        { status: 400 }
      )
    }

    // Perform bulk delete
    const result = await db.product.deleteMany({
      where: {
        id: {
          in: productIds,
        },
      },
    })

    return NextResponse.json({
      message: "Products deleted successfully",
      count: result.count,
    })
  } catch (error: any) {
    console.error("Failed to bulk delete products:", error)
    return NextResponse.json(
      {
        error: "Failed to bulk delete products",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

