import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ManualPaymentReviewStatus, NotificationType, ShopPaymentMethod } from "@prisma/client"
import { applyRewardsAfterManualPaymentConfirmed } from "@/lib/manual-order-rewards"
import { maybeSendOrderConfirmation } from "@/lib/email/order-confirmation"
import { confirmTrainingBookings } from "@/lib/cart-training"
import { releaseOrderReservations } from "@/lib/order-reservations"

const ORDER_DETAIL_INCLUDE = {
  items: {
    include: {
      product: true,
    },
  },
  trainingItems: {
    include: {
      program: {
        select: { id: true, title: true, image: true },
      },
      session: {
        select: { id: true, startDate: true, endDate: true, location: true },
      },
    },
  },
  user: {
    select: { id: true, email: true, name: true },
  },
} as const

const VALID_ORDER_STATUSES = new Set([
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
])

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const order = await db.order.findUnique({
      where: { id },
      include: ORDER_DETAIL_INCLUDE,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { status, trackingNumber, carrier, estimatedDelivery, manualPaymentAction } = body

    // Get the order first to check ownership and current status
    const existingOrder = await db.order.findUnique({
      where: { id },
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

    if (session.user.role === "ADMIN" && manualPaymentAction) {
      const action = String(manualPaymentAction).toLowerCase()
      if (action !== "confirm" && action !== "cancel") {
        return NextResponse.json({ error: "Invalid manualPaymentAction" }, { status: 400 })
      }

      const isManual =
        existingOrder.shopPaymentMethod === ShopPaymentMethod.MBWAY ||
        existingOrder.shopPaymentMethod === ShopPaymentMethod.BANK_TRANSFER

      if (!isManual) {
        return NextResponse.json(
          { error: "Manual payment actions apply only to MBWay or bank transfer orders" },
          { status: 400 }
        )
      }

      if (action === "confirm") {
        if (
          existingOrder.manualPaymentStatus !== ManualPaymentReviewStatus.PENDING ||
          existingOrder.status !== "PENDING"
        ) {
          return NextResponse.json(
            { error: "Order is not awaiting payment confirmation" },
            { status: 400 }
          )
        }

        const updated = await db.order.update({
          where: { id },
          data: {
            manualPaymentStatus: ManualPaymentReviewStatus.CONFIRMED,
            status: "PROCESSING",
          },
          include: ORDER_DETAIL_INCLUDE,
        })

        // Payment confirmed — convert pending training holds to confirmed seats
        const orderTrainings = await db.orderTrainingItem.findMany({
          where: { orderId: id },
          select: { bookingId: true },
        })
        await confirmTrainingBookings(orderTrainings)

        await applyRewardsAfterManualPaymentConfirmed({
          userId: existingOrder.userId,
          orderId: id,
          total: Number(existingOrder.total),
          appliedCouponCode: existingOrder.appliedCouponCode,
        })

        try {
          await db.notification.create({
            data: {
              type: "ORDER_STATUS",
              title: "Pagamento confirmado",
              message: `O seu pedido #${id.slice(0, 8)} foi confirmado e está a ser processado.`,
              userId: existingOrder.userId,
              metadata: { orderId: id, orderStatus: "PROCESSING" },
            },
          })
        } catch (e) {
          console.error("Notify manual payment confirm:", e)
        }

        try {
          await maybeSendOrderConfirmation(id)
        } catch (emailError) {
          console.error("Failed to send order confirmation after manual confirm:", emailError)
        }

        return NextResponse.json(updated)
      }

      if (action === "cancel") {
        if (existingOrder.manualPaymentStatus === ManualPaymentReviewStatus.CANCELLED) {
          return NextResponse.json({ error: "Order is already cancelled" }, { status: 400 })
        }

        const previousStatus = existingOrder.status

        const updated = await db.order.update({
          where: { id },
          data: {
            manualPaymentStatus: ManualPaymentReviewStatus.CANCELLED,
            status: "CANCELLED",
          },
          include: ORDER_DETAIL_INCLUDE,
        })

        await releaseOrderReservations(id, { previousStatus })

        try {
          await db.notification.create({
            data: {
              type: "ORDER_STATUS",
              title: "Pedido cancelado",
              message: `O seu pedido #${id.slice(0, 8)} foi cancelado.`,
              userId: existingOrder.userId,
              metadata: { orderId: id, orderStatus: "CANCELLED" },
            },
          })
        } catch (e) {
          console.error("Notify manual payment cancel:", e)
        }

        return NextResponse.json(updated)
      }
    }

    // Users can only cancel their own orders (if status is PENDING or PROCESSING)
    // Admins can update any order
    if (session.user.role !== "ADMIN") {
      if (existingOrder.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      // Users can only cancel orders
      if (status && status !== "CANCELLED") {
        return NextResponse.json(
          { error: "You can only cancel orders" },
          { status: 403 }
        )
      }
      // Only allow cancellation if order is PENDING or PROCESSING
      if (status === "CANCELLED") {
        if (
          existingOrder.status !== "PENDING" &&
          existingOrder.status !== "PROCESSING"
        ) {
          return NextResponse.json(
            { error: "This order cannot be cancelled" },
            { status: 400 }
          )
        }
      }
    }

    // Build update data
    if (!status || !VALID_ORDER_STATUSES.has(status)) {
      return NextResponse.json(
        { error: status ? "Invalid order status" : "Status is required" },
        { status: 400 }
      )
    }

    if (existingOrder.status === status) {
      const unchanged = await db.order.findUnique({
        where: { id },
        include: ORDER_DETAIL_INCLUDE,
      })
      return NextResponse.json(unchanged)
    }

    const updateData = { status }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: ORDER_DETAIL_INCLUDE,
    })

    if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
      try {
        await releaseOrderReservations(id, { previousStatus: existingOrder.status })
      } catch (releaseError) {
        console.error("Failed to release order reservations on cancel:", releaseError)
      }
    }

    // Create notification for the customer if status changed
    if (existingOrder.status !== status && existingOrder.userId) {
      let notificationType = "ORDER_STATUS"
      let title = "Order Status Updated"
      let message = `Your order #${id.slice(0, 8)} status has been updated to ${status}`

      if (status === "SHIPPED") {
        notificationType = "ORDER_SHIPPED"
        title = "Order Shipped"
        message = `Great news! Your order #${id.slice(0, 8)} has been shipped and is on its way.`
      } else if (status === "DELIVERED") {
        notificationType = "ORDER_DELIVERED"
        title = "Order Delivered"
        message = `Your order #${id.slice(0, 8)} has been delivered. Thank you for your purchase!`
      } else if (status === "CANCELLED") {
        title = "Order Cancelled"
        message = `Your order #${id.slice(0, 8)} has been cancelled.`
      }

      await db.notification.create({
        data: {
          type: notificationType as NotificationType,
          title,
          message,
          userId: existingOrder.userId,
          metadata: {
            orderId: id,
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

