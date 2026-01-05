import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { getReferralByUserId, activateReferral } from "@/lib/affiliate"
import { calculatePoints, awardPoints } from "@/lib/points"
import { checkAndNotifyMilestones } from "@/lib/notifications/affiliate-milestones"
import { autoPromoteAffiliate } from "@/lib/affiliate-tiers"
import { calculateTax } from "@/lib/tax"

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
    const { userId, shippingAddress, couponCode, discountAmount, postalCode, taxAmount, taxRate, taxRegion } = paymentIntent.metadata

    // Get user's cart
    const cart = await db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (cart && cart.items.length > 0) {
      // Calculate subtotal
      const subtotal = cart.items.reduce(
        (sum, item) => {
          if (!item.product || !item.product.price) {
            console.error(`Product or price missing for cart item ${item.id}`)
            return sum
          }
          return sum + Number(item.product.price) * item.quantity
        },
        0
      )

      // Get discount from metadata or calculate from payment intent amount
      const discount = discountAmount ? parseFloat(discountAmount) : 0
      const subtotalAfterDiscount = Math.max(0, subtotal - discount)
      
      // Calculate tax if not already in metadata
      let calculatedTaxAmount = 0
      let calculatedTaxRate: number | null = null
      let calculatedTaxRegion: string | null = null

      if (taxAmount && taxRate && taxRegion) {
        // Use tax info from payment intent metadata
        calculatedTaxAmount = parseFloat(taxAmount)
        calculatedTaxRate = parseFloat(taxRate)
        calculatedTaxRegion = taxRegion
      } else {
        // Calculate tax based on postal code
        let postalCodeToUse = postalCode

        // Extract postal code from shipping address if not in metadata
        if (!postalCodeToUse && shippingAddress) {
          const addressLines = shippingAddress.split("\n")
          if (addressLines.length >= 5) {
            const postalCodeLine = addressLines[4]
            if (postalCodeLine) {
              const match = postalCodeLine.match(/\d{4}(?:-\d{3})?/)
              if (match) {
                postalCodeToUse = match[0]
              }
            }
          }
        }

        if (postalCodeToUse) {
          try {
            const taxResult = await calculateTax(subtotalAfterDiscount, postalCodeToUse)
            calculatedTaxAmount = taxResult.taxAmount
            calculatedTaxRate = taxResult.taxRate
            calculatedTaxRegion = taxResult.taxRegion
          } catch (error) {
            console.error("Failed to calculate tax:", error)
            // Default to 23% (Mainland Portugal) if calculation fails
            calculatedTaxAmount = subtotalAfterDiscount * 0.23
            calculatedTaxRate = 23.0
            calculatedTaxRegion = "Mainland Portugal"
          }
        } else {
          // Default to 23% (Mainland Portugal) if no postal code
          calculatedTaxAmount = subtotalAfterDiscount * 0.23
          calculatedTaxRate = 23.0
          calculatedTaxRegion = "Mainland Portugal"
        }
      }
      
      // Use the actual payment amount from Stripe (which already has discount and tax applied)
      const actualTotal = paymentIntent.amount / 100

      // Get user info for notification
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      })

      // Check for affiliate referral
      const referral = await getReferralByUserId(userId)
      let affiliateReferralId: string | null = null

      if (referral) {
        affiliateReferralId = referral.id
      }

      // Create order first
      const order = await db.order.create({
        data: {
          userId,
          total: actualTotal, // Use the actual payment amount
          shippingAddress: shippingAddress || null,
          paymentIntentId: paymentIntent.id,
          affiliateReferralId,
          taxRate: calculatedTaxRate,
          taxAmount: calculatedTaxAmount,
          taxRegion: calculatedTaxRegion,
          status: "PROCESSING",
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      })

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
      await db.cartItem.deleteMany({
        where: { cartId: cart.id },
      })

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

