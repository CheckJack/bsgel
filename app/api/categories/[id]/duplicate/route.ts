import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Fetch the original category
    const originalCategory = await db.category.findUnique({
      where: { id: params.id },
    });

    if (!originalCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Create a duplicate with "Copy of" prefix
    const duplicatedCategory = await db.category.create({
      data: {
        name: `Copy of ${originalCategory.name}`,
        slug: `${originalCategory.slug}-copy-${Date.now()}`,
        description: originalCategory.description,
        image: (originalCategory as any).image || null,
        icon: (originalCategory as any).icon || null,
      },
    });

    return NextResponse.json(duplicatedCategory, { status: 201 });
  } catch (error: any) {
    console.error("Failed to duplicate category:", error);
    
    // Check for duplicate slug
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this slug already exists. Please try again." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Failed to duplicate category",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

