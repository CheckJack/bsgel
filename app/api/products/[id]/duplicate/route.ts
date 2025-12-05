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

    // Fetch the original product
    const originalProduct = await db.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
      },
    });

    if (!originalProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Create a duplicate with "Copy of" prefix
    const duplicatedProduct = await db.product.create({
      data: {
        name: `Copy of ${originalProduct.name}`,
        description: originalProduct.description,
        price: originalProduct.price,
        salePrice: originalProduct.salePrice,
        discountPercentage: originalProduct.discountPercentage,
        image: originalProduct.image,
        images: originalProduct.images,
        featured: false, // Don't duplicate featured status
        categoryId: originalProduct.categoryId,
        attributes: originalProduct.attributes,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(duplicatedProduct, { status: 201 });
  } catch (error: any) {
    console.error("Failed to duplicate product:", error);
    return NextResponse.json(
      {
        error: "Failed to duplicate product",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

