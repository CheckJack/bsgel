import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Failed to fetch product:", error)
    return NextResponse.json(
      { error: "Failed to fetch product" },
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
    const { name, description, price, image, images, categoryId, featured, attributes } = body

    // Prepare the data object, handling attributes properly
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (image !== undefined) updateData.image = image
    if (images !== undefined) updateData.images = images
    if (featured !== undefined) updateData.featured = featured
    
    // Handle categoryId using relation syntax (required for updates in some Prisma versions)
    if (categoryId !== undefined) {
      if (categoryId === null || categoryId === "") {
        updateData.category = { disconnect: true }
      } else {
        updateData.category = { connect: { id: categoryId } }
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

    const product = await db.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
      },
    })

    return NextResponse.json(product)
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

