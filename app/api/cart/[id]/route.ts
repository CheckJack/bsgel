import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { validateQuantity } from "@/lib/stock"

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    
    // Validate input
    const validationResult = updateCartItemSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { quantity } = validationResult.data

    // Verify cart item belongs to the user
    const cartItem = await db.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    })

    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 })
    }

    if (cartItem.cart.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const check = await validateQuantity(cartItem.productId, quantity)
    if (!check.ok) {
      if (check.code === "INSUFFICIENT_STOCK" && check.available > 0) {
        await db.cartItem.update({
          where: { id },
          data: { quantity: check.available },
        })
        return NextResponse.json(
          {
            error: "INSUFFICIENT_STOCK",
            available: check.available,
            productId: cartItem.productId,
            partial: true,
          },
          { status: 409 }
        )
      }
      return NextResponse.json(
        {
          error: check.code,
          available: check.available,
          productId: cartItem.productId,
        },
        { status: 409 }
      )
    }

    await db.cartItem.update({
      where: { id },
      data: { quantity },
    })

    return NextResponse.json({ message: "Cart item updated" })
  } catch (error) {
    console.error("Failed to update cart item:", error)
    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify cart item belongs to the user
    const cartItem = await db.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    })

    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 })
    }

    if (cartItem.cart.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db.cartItem.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Item removed from cart" })
  } catch (error) {
    console.error("Failed to remove cart item:", error)
    return NextResponse.json(
      { error: "Failed to remove cart item" },
      { status: 500 }
    )
  }
}

