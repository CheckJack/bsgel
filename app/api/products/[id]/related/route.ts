import { NextResponse } from "next/server"
import { db } from "@/lib/db"

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

    const relatedProducts: any[] = []
    const productIds = new Set<string>([params.id]) // Track products we've already included

    // Strategy 1: Find products frequently bought together
    // Get orders that contain this product
    const ordersWithThisProduct = await db.orderItem.findMany({
      where: {
        productId: params.id,
      },
      select: {
        orderId: true,
      },
    })

    if (ordersWithThisProduct.length > 0) {
      const orderIds = ordersWithThisProduct.map((item) => item.orderId)

      // Find other products in those same orders
      const frequentlyBoughtTogether = await db.orderItem.groupBy({
        by: ["productId"],
        where: {
          orderId: { in: orderIds },
          productId: { not: params.id }, // Exclude current product
        },
        _count: {
          productId: true,
        },
        orderBy: {
          _count: {
            productId: "desc",
          },
        },
        take: 4, // Get top 4 most frequently bought together
      })

      // Fetch the actual products
      const frequentlyBoughtProductIds = frequentlyBoughtTogether.map(
        (item) => item.productId
      )

      if (frequentlyBoughtProductIds.length > 0) {
        const frequentlyBoughtProducts = await db.product.findMany({
          where: {
            id: { in: frequentlyBoughtProductIds },
          },
          include: {
            category: true,
          },
        })

        // Add to related products, maintaining order by frequency
        for (const productId of frequentlyBoughtProductIds) {
          const product = frequentlyBoughtProducts.find((p) => p.id === productId)
          if (product) {
            relatedProducts.push(product)
            productIds.add(product.id)
          }
        }
      }
    }

    // Strategy 2: If we don't have enough products, add products from the same category
    if (relatedProducts.length < 4 && product.categoryId) {
      const categoryProducts = await db.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { notIn: Array.from(productIds) }, // Exclude already included products
        },
        include: {
          category: true,
        },
        take: 4 - relatedProducts.length,
        orderBy: {
          createdAt: "desc", // Show newest first
        },
      })

      relatedProducts.push(...categoryProducts)
      categoryProducts.forEach((p) => productIds.add(p.id))
    }

    // Strategy 3: If still not enough, add featured products from other categories
    if (relatedProducts.length < 4) {
      const featuredProducts = await db.product.findMany({
        where: {
          featured: true,
          id: { notIn: Array.from(productIds) },
        },
        include: {
          category: true,
        },
        take: 4 - relatedProducts.length,
        orderBy: {
          createdAt: "desc",
        },
      })

      relatedProducts.push(...featuredProducts)
    }

    // Limit to 4 products max
    const finalRelatedProducts = relatedProducts.slice(0, 4)

    return NextResponse.json({ products: finalRelatedProducts })
  } catch (error) {
    console.error("Failed to fetch related products:", error)
    return NextResponse.json(
      { error: "Failed to fetch related products" },
      { status: 500 }
    )
  }
}

