import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { canUserPurchaseProduct } from "@/lib/certifications"
import { clampCartItemsToStock } from "@/lib/stock"
import { resolveCartQuantity, upsertCartItem } from "@/lib/stock-cart"
import {
  cartWithTrainingInclude,
  clearUserCart,
  decimalToString,
  serializeTrainingCartItem,
} from "@/lib/cart-training"

function serializeProductCartItems(
  items: Array<{
    id: string
    quantity: number
    product: {
      id: string
      name: string
      price: unknown
      image: string | null
      description: string | null
      categoryId: string | null
      stockQuantity: number | null
      outOfStock: boolean
      category: { id: string; name: string; slug: string } | null
    }
  }>
) {
  return items.map((item) => ({
    id: item.id,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: decimalToString(item.product.price as never),
      image: item.product.image,
      description: item.product.description,
      categoryId: item.product.categoryId,
      stockQuantity: item.product.stockQuantity,
      outOfStock: item.product.outOfStock,
      category: item.product.category
        ? {
            id: item.product.category.id,
            name: item.product.category.name,
            slug: item.product.category.slug,
          }
        : null,
    },
    quantity: item.quantity,
  }))
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cart = await db.cart.findUnique({
      where: { userId: session.user.id },
      include: cartWithTrainingInclude,
    })

    if (!cart) {
      return NextResponse.json({ items: [], trainingItems: [] })
    }

    await clampCartItemsToStock(session.user.id)
    const refreshed = await db.cart.findUnique({
      where: { userId: session.user.id },
      include: cartWithTrainingInclude,
    })
    if (!refreshed) {
      return NextResponse.json({ items: [], trainingItems: [] })
    }

    return NextResponse.json({
      items: serializeProductCartItems(refreshed.items),
      trainingItems: refreshed.trainingItems.map(serializeTrainingCartItem),
    })
  } catch (error: any) {
    console.error("Failed to fetch cart:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        error: "Failed to fetch cart",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { productId, quantity } = body

    // Validate input
    if (!productId || typeof productId !== "string" || productId.trim().length === 0) {
      return NextResponse.json(
        { error: "Valid product ID is required" },
        { status: 400 }
      )
    }

    if (!quantity || typeof quantity !== "number" || quantity <= 0 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: "Quantity must be a positive integer" },
        { status: 400 }
      )
    }

    // Validate certification before adding to cart
    const accessCheck = await canUserPurchaseProduct(session.user.id, productId)
    if (!accessCheck.canPurchase) {
      return NextResponse.json(
        { error: accessCheck.error || "You do not have permission to purchase this product" },
        { status: 403 }
      )
    }

    // Get or create cart
    let cart = await db.cart.findUnique({
      where: { userId: session.user.id },
    })

    if (!cart) {
      cart = await db.cart.create({
        data: { userId: session.user.id },
      })
    }

    const existingItem = await db.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    })

    const existingQty = existingItem?.quantity ?? 0
    const resolved = await resolveCartQuantity(productId, quantity, existingQty)

    if (!resolved.ok) {
      const product = await db.product.findUnique({
        where: { id: productId },
        select: { stockQuantity: true },
      })
      const available = product?.stockQuantity ?? 0
      if (resolved.body.error === "INSUFFICIENT_STOCK" && available > existingQty) {
        const clampedQty = available
        await upsertCartItem(session.user.id, productId, clampedQty)
        return NextResponse.json(
          {
            ...resolved.body,
            partial: true,
            addedQuantity: clampedQty - existingQty,
          },
          { status: 409 }
        )
      }
      return NextResponse.json(resolved.body, { status: 409 })
    }

    await upsertCartItem(session.user.id, productId, resolved.quantity)

    return NextResponse.json({ message: "Item added to cart", quantity: resolved.quantity })
  } catch (error) {
    console.error("Failed to add item to cart:", error)
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cart = await db.cart.findUnique({
      where: { userId: session.user.id },
    })

    if (cart) {
      await clearUserCart(cart.id)
    }

    return NextResponse.json({ message: "Cart cleared" })
  } catch (error) {
    console.error("Failed to clear cart:", error)
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    )
  }
}

