import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const category = await db.category.findUnique({
      where: { id: params.id },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error("Failed to fetch category:", error)
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { name, slug, description, image, icon } = body

    // Validate required fields
    if (name !== undefined && !name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Normalize slug to lowercase if provided
    const normalizedSlug = slug ? slug.toLowerCase().trim() : undefined

    // Check if a category with this slug already exists (excluding current category)
    if (normalizedSlug) {
      const existingCategory = await db.category.findFirst({
        where: {
          slug: normalizedSlug,
          NOT: { id: params.id },
        },
        select: { name: true, slug: true },
      })

      if (existingCategory) {
        return NextResponse.json(
          {
            error: `A category with this slug already exists. The category "${existingCategory.name}" uses the slug "${existingCategory.slug}". Please use a different name or slug.`,
          },
          { status: 400 }
        )
      }
    }

    // Build update data object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (normalizedSlug !== undefined) updateData.slug = normalizedSlug
    if (description !== undefined) updateData.description = description || null
    if (image !== undefined) updateData.image = image || null
    if (icon !== undefined) updateData.icon = icon || null

    const category = await db.category.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(category)
  } catch (error: any) {
    console.error("Failed to update category:", error)

    // Check for duplicate slug (fallback in case the check above didn't catch it)
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this slug already exists. Please use a different name or slug." },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error?.message || "Failed to update category" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if category has products
    const category = await db.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Check if category has products
    if (category._count.products > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category. It has ${category._count.products} product(s) associated with it. Please remove or reassign the products first.`,
        },
        { status: 400 }
      )
    }

    await db.category.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error: any) {
    console.error("Failed to delete category:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to delete category" },
      { status: 500 }
    )
  }
}

