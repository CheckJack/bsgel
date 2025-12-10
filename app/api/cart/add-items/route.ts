import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { canUserPurchaseProduct } from "@/lib/certifications"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { items } = await req.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 }
      )
    }

    // Validate all items before adding
    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return NextResponse.json(
          { error: "Each item must have productId and quantity" },
          { status: 400 }
        )
      }

      // Validate certification
      const accessCheck = await canUserPurchaseProduct(session.user.id, item.productId)
      if (!accessCheck.canPurchase) {
        return NextResponse.json(
          { error: accessCheck.error || `You do not have permission to purchase product ${item.productId}` },
          { status: 403 }
        )
      }
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

    // Add all items
    const results = []
    for (const item of items) {
      const existingItem = await db.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: item.productId,
          },
        },
      })

      if (existingItem) {
        // Update quantity
        await db.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + item.quantity },
        })
        results.push({ productId: item.productId, action: "updated" })
      } else {
        // Create new item
        await db.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            quantity: item.quantity,
          },
        })
        results.push({ productId: item.productId, action: "added" })
      }
    }

    return NextResponse.json({ 
      message: "Items added to cart",
      results 
    })
  } catch (error) {
    console.error("Failed to add items to cart:", error)
    return NextResponse.json(
      { error: "Failed to add items to cart" },
      { status: 500 }
    )
  }
}

