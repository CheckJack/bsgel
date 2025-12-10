import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { categoryIds } = body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: "Category IDs array is required" },
        { status: 400 }
      );
    }

    // Check if any categories have products
    const categoriesWithProducts = await db.category.findMany({
      where: {
        id: { in: categoryIds },
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const categoriesToDelete: string[] = [];
    const categoriesWithProductsList: string[] = [];

    for (const category of categoriesWithProducts) {
      if (category._count.products > 0) {
        categoriesWithProductsList.push(category.name);
      } else {
        categoriesToDelete.push(category.id);
      }
    }

    if (categoriesWithProductsList.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete ${categoriesWithProductsList.length} category/categories. They have products associated with them.`,
          categories: categoriesWithProductsList,
        },
        { status: 400 }
      );
    }

    // Delete categories
    const result = await db.category.deleteMany({
      where: {
        id: { in: categoriesToDelete },
      },
    });

    return NextResponse.json({
      message: "Categories deleted successfully",
      count: result.count,
    });
  } catch (error: any) {
    console.error("Failed to bulk delete categories:", error);
    return NextResponse.json(
      {
        error: "Failed to delete categories",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { categoryIds, updates } = body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: "Category IDs array is required" },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Updates object is required" },
        { status: 400 }
      );
    }

    // Normalize slug if provided
    if (updates.slug) {
      updates.slug = updates.slug.toLowerCase().trim();
    }

    // Check for duplicate slugs if slug is being updated
    if (updates.slug) {
      const existingCategory = await db.category.findFirst({
        where: {
          slug: updates.slug,
          NOT: { id: { in: categoryIds } },
        },
      });

      if (existingCategory) {
        return NextResponse.json(
          {
            error: `A category with slug "${updates.slug}" already exists. Please use a different slug.`,
          },
          { status: 400 }
        );
      }
    }

    // Update categories
    const result = await db.category.updateMany({
      where: {
        id: { in: categoryIds },
      },
      data: updates,
    });

    return NextResponse.json({
      message: "Categories updated successfully",
      count: result.count,
    });
  } catch (error: any) {
    console.error("Failed to bulk update categories:", error);
    
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this slug already exists. Please use a different slug." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Failed to update categories",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

