import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const attribute = await db.attribute.findUnique({
      where: { id: params.id },
    })

    if (!attribute) {
      return NextResponse.json(
        { error: "Attribute not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(attribute)
  } catch (error) {
    console.error("Failed to fetch attribute:", error)
    return NextResponse.json(
      { error: "Failed to fetch attribute" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { category, values } = body

    if (!category || !values || !Array.isArray(values)) {
      return NextResponse.json(
        { error: "Category and values array are required" },
        { status: 400 }
      )
    }

    const attribute = await db.attribute.update({
      where: { id: params.id },
      data: {
        category,
        values,
      },
    })

    return NextResponse.json(attribute)
  } catch (error: any) {
    console.error("Failed to update attribute:", error)
    
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Attribute not found" },
        { status: 404 }
      )
    }
    
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Attribute with this category already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to update attribute" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.attribute.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Attribute deleted successfully" })
  } catch (error: any) {
    console.error("Failed to delete attribute:", error)
    
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Attribute not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to delete attribute" },
      { status: 500 }
    )
  }
}

