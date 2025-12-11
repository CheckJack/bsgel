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

    // Handle price (if provided)
    if (updates.price !== undefined && updates.price !== null && updates.price !== "") {
      updateData.price = parseFloat(updates.price)
    }

    // Handle discountPercentage (if provided)
    if (updates.discountPercentage !== undefined && updates.discountPercentage !== null && updates.discountPercentage !== "") {
      updateData.discountPercentage = parseInt(updates.discountPercentage)
    }

    // Handle showcasingSections (if provided)
    if (updates.showcasingSections !== undefined) {
      updateData.showcasingSections = Array.isArray(updates.showcasingSections) ? updates.showcasingSections : []
    }

    // Handle salePrice calculation if discountPercentage is provided
    if (updates.discountPercentage !== undefined && updates.discountPercentage !== null && updates.discountPercentage !== "") {
      // We'll need to fetch products first to calculate salePrice
      // For now, we'll update discountPercentage and let the frontend calculate salePrice
      // Or we can calculate it here if we have the original price
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
        if (updateData.price !== undefined) productUpdate.price = updateData.price
        if (updateData.discountPercentage !== undefined) productUpdate.discountPercentage = updateData.discountPercentage
        if (updateData.showcasingSections !== undefined) productUpdate.showcasingSections = updateData.showcasingSections
        
        // Update product with non-relation fields first
        if (Object.keys(productUpdate).length > 0) {
          await db.product.update({
            where: { id },
            data: productUpdate,
          })
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

