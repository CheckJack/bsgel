import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Check if user owns the order or is admin
    if (order.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Failed to fetch order:", error)
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await req.json()

    // Get the order first to check the previous status
    const existingOrder = await db.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = await db.order.update({
      where: { id: params.id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Create notification for the customer if status changed
    if (existingOrder.status !== status && existingOrder.userId) {
      let notificationType = "ORDER_STATUS"
      let title = "Order Status Updated"
      let message = `Your order #${params.id.slice(0, 8)} status has been updated to ${status}`

      if (status === "SHIPPED") {
        notificationType = "ORDER_SHIPPED"
        title = "Order Shipped"
        message = `Great news! Your order #${params.id.slice(0, 8)} has been shipped and is on its way.`
      } else if (status === "DELIVERED") {
        notificationType = "ORDER_DELIVERED"
        title = "Order Delivered"
        message = `Your order #${params.id.slice(0, 8)} has been delivered. Thank you for your purchase!`
      } else if (status === "CANCELLED") {
        title = "Order Cancelled"
        message = `Your order #${params.id.slice(0, 8)} has been cancelled.`
      }

      await db.notification.create({
        data: {
          type: notificationType as any,
          title,
          message,
          userId: existingOrder.userId,
          metadata: {
            orderId: params.id,
            orderStatus: status,
          },
        },
      })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Failed to update order:", error)
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    )
  }
}

