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
    if (updates.price !== undefined && updates.price !== null) {
      updateData.price = parseFloat(updates.price)
    }

    // If no valid updates, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      )
    }

    // Perform bulk update
    // Note: Prisma's updateMany doesn't support relations (category connect/disconnect)
    // So we need to update each product individually if category is being updated
    if (updateData.category) {
      // Update each product individually to handle category relation
      const updatePromises = productIds.map((id: string) =>
        db.product.update({
          where: { id },
          data: updateData,
        })
      )
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

