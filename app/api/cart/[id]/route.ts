import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { quantity } = await req.json()

    if (quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      )
    }

    await db.cartItem.update({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.cartItem.delete({
      where: { id: params.id },
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

