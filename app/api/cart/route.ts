import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { canUserPurchaseProduct } from "@/lib/certifications"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cart = await db.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

    if (!cart) {
      return NextResponse.json({ items: [] })
    }

    return NextResponse.json({
      items: cart.items.map((item) => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price.toString(),
          image: item.product.image,
          description: item.product.description,
          categoryId: item.product.categoryId,
          category: item.product.category ? {
            id: item.product.category.id,
            name: item.product.category.name,
            slug: item.product.category.slug,
          } : null,
        },
        quantity: item.quantity,
      })),
    })
  } catch (error) {
    console.error("Failed to fetch cart:", error)
    return NextResponse.json(
      { error: "Failed to fetch cart" },
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

    const { productId, quantity } = await req.json()

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: "Product ID and quantity are required" },
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

    // Check if item already exists in cart
    const existingItem = await db.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    })

    if (existingItem) {
      // Update quantity
      await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      })
    } else {
      // Create new item
      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      })
    }

    return NextResponse.json({ message: "Item added to cart" })
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
      await db.cartItem.deleteMany({
        where: { cartId: cart.id },
      })
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

