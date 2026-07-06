import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { getReferralByUserId, activateReferral } from "@/lib/affiliate"
import { calculatePoints, awardPoints } from "@/lib/points"
import { checkAndNotifyMilestones } from "@/lib/notifications/affiliate-milestones"
import { autoPromoteAffiliate } from "@/lib/affiliate-tiers"
import { calculateShipping } from "@/lib/shipping"
import { decrementStockForOrder, validateCartStock } from "@/lib/stock"
import {
  cartWithTrainingInclude,
  clearUserCart,
  confirmTrainingBookings,
  getCartSubtotal,
  isCartEmpty,
} from "@/lib/cart-training"
import { ShopPaymentMethod } from "@prisma/client"

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as any
    const {
      userId,
      shippingAddress,
      couponCode,
      discountAmount,
      postalCode,
      shippingAmount,
      shopPaymentMethod: shopPaymentMethodMeta,
    } = paymentIntent.metadata

    // Get user's cart
    const cart = await db.cart.findUnique({
      where: { userId },
      include: cartWithTrainingInclude,
    })

    if (cart && !isCartEmpty(cart)) {
      if (cart.items.length > 0) {
        const stockError = await validateCartStock(userId)
        if (stockError) {
          console.error("Webhook order blocked: insufficient stock", stockError)
          return NextResponse.json({ received: true, stockBlocked: true })
        }
      }

      const subtotal = getCartSubtotal(cart)

      // Get discount from metadata or calculate from payment intent amount
      const discount = discountAmount ? parseFloat(discountAmount) : 0
      const subtotalAfterDiscount = Math.max(0, subtotal - discount)
      
      // Tax is already included in product prices (23% IVA), keep informational only.
      let calculatedTaxAmount = 0
      let calculatedShippingAmount = 0
      let calculatedTaxRate: number | null = null
      let calculatedTaxRegion: string | null = null

      calculatedTaxAmount = 0
      calculatedTaxRate = 23.0
      calculatedTaxRegion = "IVA 23% included"

      if (shippingAmount) {
        calculatedShippingAmount = parseFloat(shippingAmount)
      } else if (postalCode) {
        try {
          const shippingResult = await calculateShipping(subtotalAfterDiscount, postalCode)
          calculatedShippingAmount = shippingResult.shippingAmount
        } catch (error) {
          console.error("Failed to calculate shipping:", error)
        }
      }
      
      // Use the actual payment amount from Stripe (which already has discount and tax applied)
      const actualTotal = paymentIntent.amount / 100

      // Get user info for notification + saved billing (Stripe metadata is too small for full morada)
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, billingNif: true, billingAddress: true },
      })

      // Check for affiliate referral
      const referral = await getReferralByUserId(userId)
      let affiliateReferralId: string | null = null

      if (referral) {
        affiliateReferralId = referral.id
      }

      const stripeShopMethod =
        shopPaymentMethodMeta === "STRIPE_KLARNA"
          ? ShopPaymentMethod.STRIPE_KLARNA
          : ShopPaymentMethod.STRIPE_CARD

      // Create order first
      const order = await db.order.create({
        data: {
          userId,
          total: actualTotal, // Use the actual payment amount
          shippingAddress: shippingAddress || null,
          billingNif: user?.billingNif?.trim() || null,
          billingAddress: user?.billingAddress?.trim() || null,
          paymentIntentId: paymentIntent.id,
          shopPaymentMethod: stripeShopMethod,
          appliedCouponCode: couponCode?.trim() ? String(couponCode).trim() : null,
          affiliateReferralId,
          taxRate: calculatedTaxRate,
          taxAmount: calculatedTaxAmount,
          shippingAmount: calculatedShippingAmount,
          taxRegion: calculatedTaxRegion,
          status: "PROCESSING",
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
          trainingItems: {
            create: cart.trainingItems.map((item) => ({
              sessionId: item.sessionId,
              programId: item.session.programId,
              bookingId: item.bookingId,
              price: item.session.program.price,
              quantity: 1,
            })),
          },
        },
      })

      if (cart.items.length > 0) {
        await decrementStockForOrder(
          cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        )
      }

      await confirmTrainingBookings(cart.trainingItems)

      // Handle affiliate referral points after order creation
      if (referral) {
        // Check if this is the first order (referral status is still PENDING)
        const currentReferral = await db.affiliateReferral.findUnique({
          where: { id: referral.id },
        })

        if (currentReferral && currentReferral.status === "PENDING") {
          // Activate referral and link first order
          await activateReferral(referral.id, order.id)
          
          // Award points for first order
          const firstOrderPoints = await calculatePoints("REFERRAL_FIRST_ORDER", actualTotal)
          if (firstOrderPoints > 0) {
            const affiliate = await db.affiliate.findUnique({ where: { id: referral.affiliateId } })
            if (affiliate) {
              await awardPoints(
                affiliate.userId,
                firstOrderPoints,
                "AFFILIATE_PURCHASE",
                order.id,
                `Referral first order: ${actualTotal}€`
              )
              
              // Check for milestones
              await checkAndNotifyMilestones(affiliate.userId, affiliate.id)
              
              // Auto-promote tier if applicable
              await autoPromoteAffiliate(affiliate.id)
            }
          }
        } else if (currentReferral && currentReferral.status === "ACTIVE") {
          // Repeat order - award points for repeat order
          const repeatOrderPoints = await calculatePoints("REFERRAL_REPEAT_ORDER", actualTotal)
          if (repeatOrderPoints > 0) {
            const affiliate = await db.affiliate.findUnique({ where: { id: referral.affiliateId } })
            if (affiliate) {
              await awardPoints(
                affiliate.userId,
                repeatOrderPoints,
                "AFFILIATE_PURCHASE",
                order.id,
                `Referral repeat order: ${actualTotal}€`
              )
            }
          }
        }
      }

      // Award points to order owner for own purchase (if configured)
      const ownPurchasePoints = await calculatePoints("OWN_PURCHASE", actualTotal)
      if (ownPurchasePoints > 0) {
        await awardPoints(
          userId,
          ownPurchasePoints,
          "AFFILIATE_PURCHASE",
          order.id,
          `Purchase points: ${actualTotal}€`
        )
      }

      // Increment coupon usage count if coupon was applied
      if (couponCode) {
        try {
          await db.coupon.updateMany({
            where: { code: couponCode },
            data: { usedCount: { increment: 1 } },
          })
          
          // Update redemption status to USED if this is a reward redemption coupon
          await db.pointsRedemption.updateMany({
            where: { couponCode: couponCode.toUpperCase().trim() },
            data: { status: "USED" },
          })
        } catch (error) {
          console.error("Failed to update coupon usage count:", error)
          // Don't fail order creation if coupon update fails
        }
      }

      // Clear cart
      await clearUserCart(cart.id)

      // Create notification for admin users when a new order is placed
      try {
        await db.notification.create({
          data: {
            type: "ORDER",
            title: "New Order",
            message: `New order #${order.id.slice(0, 8)} from ${user?.name || user?.email || "Customer"} - ${formatPrice(actualTotal)}`,
            metadata: {
              orderId: order.id,
              userId: userId,
              total: actualTotal.toString(),
              couponCode: couponCode || null,
              customerName: user?.name || null,
              customerEmail: user?.email || null,
            },
          },
        })
      } catch (notificationError) {
        // Log notification error but don't fail the order creation
        console.error("Failed to create order notification:", notificationError)
      }

      // Create notification for the customer
      try {
        await db.notification.create({
          data: {
            type: "ORDER_STATUS",
            title: "Order Confirmed",
            message: `Your order #${order.id.slice(0, 8)} has been confirmed and is being processed. Total: ${formatPrice(actualTotal)}`,
            userId: userId,
            metadata: {
              orderId: order.id,
              orderStatus: "PROCESSING",
              total: actualTotal.toString(),
            },
          },
        })
      } catch (notificationError) {
        // Log notification error but don't fail the order creation
        console.error("Failed to create customer notification:", notificationError)
      }
    }
  }

  return NextResponse.json({ received: true })
}

