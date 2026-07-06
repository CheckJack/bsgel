import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { canUserPurchaseProduct } from "@/lib/certifications"
import { formatPrice } from "@/lib/utils"
import { getReferralByUserId, activateReferral } from "@/lib/affiliate"
import { calculatePoints, awardPoints } from "@/lib/points"
import { calculateShipping } from "@/lib/shipping"
import { ManualPaymentReviewStatus, ShopPaymentMethod } from "@prisma/client"
import { clampCartItemsToStock, decrementStockForOrder, validateCartStock } from "@/lib/stock"
import {
  cartWithTrainingInclude,
  clearUserCart,
  confirmTrainingBookings,
  getCartSubtotal,
  isCartEmpty,
} from "@/lib/cart-training"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "date"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    const isAdmin = session.user.role === "ADMIN"

    // Build where clause
    const where: any = isAdmin && !userId ? {} : { userId: session.user.id }

    if (isAdmin && userId) {
      where.userId = userId
    }

    // Filter by status
    if (status && status !== "all") {
      where.status = status
    }

    // Search by order ID or product name
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        {
          items: {
            some: {
              product: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
      ]
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: sortOrder === "asc" ? "asc" : "desc" }
    if (sortBy === "total") {
      orderBy = { total: sortOrder === "asc" ? "asc" : "desc" }
    } else if (sortBy === "status") {
      orderBy = { status: sortOrder === "asc" ? "asc" : "desc" }
    }

    // Use select to avoid schema mismatch with missing fields
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        select: {
          id: true,
          userId: true,
          status: true,
          total: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  price: true,
                },
              },
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
        orderBy,
        skip,
        take: limit,
      }),
      db.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
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
    const {
      shippingAddress,
      paymentIntentId,
      couponCode,
      billingNif,
      billingAddress,
      shopPaymentMethod: shopPaymentMethodRaw,
    } = body

    const offlineMethod =
      shopPaymentMethodRaw === "MBWAY" || shopPaymentMethodRaw === "BANK_TRANSFER"
    if (offlineMethod && paymentIntentId) {
      return NextResponse.json(
        { error: "Invalid payment combination for offline method" },
        { status: 400 }
      )
    }

    // Get user info to check if email is banned
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user's email is banned
    const normalizedEmail = user.email.trim().toLowerCase()
    const bannedEmail = await db.bannedEmail.findUnique({
      where: { email: normalizedEmail },
    })

    if (bannedEmail) {
      return NextResponse.json(
        { error: "Your account is banned. You cannot place orders. Please contact support if you believe this is an error." },
        { status: 403 }
      )
    }

    // Get user's cart
    const cart = await db.cart.findUnique({
      where: { userId: session.user.id },
      include: cartWithTrainingInclude,
    })

    if (!cart || isCartEmpty(cart)) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

    if (cart.items.length > 0) {
      await clampCartItemsToStock(session.user.id)
      const stockError = await validateCartStock(session.user.id)
      if (stockError) {
        return NextResponse.json(
          {
            error: stockError.code,
            message:
              stockError.code === "OUT_OF_STOCK"
                ? "A product in your cart is out of stock"
                : "Not enough stock for a product in your cart",
            available: stockError.available,
            productId: stockError.productId,
          },
          { status: 409 }
        )
      }
    }

    const cartAfterClamp = await db.cart.findUnique({
      where: { userId: session.user.id },
      include: cartWithTrainingInclude,
    })
    if (!cartAfterClamp || isCartEmpty(cartAfterClamp)) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    for (const item of cartAfterClamp.items) {
      const accessCheck = await canUserPurchaseProduct(session.user.id, item.productId)
      if (!accessCheck.canPurchase) {
        return NextResponse.json(
          {
            error: accessCheck.error || `You do not have permission to purchase ${item.product.name}. Please remove it from your cart.`,
            productId: item.productId,
            productName: item.product.name,
          },
          { status: 403 }
        )
      }
    }

    const subtotal = getCartSubtotal(cartAfterClamp)

    // Get discount and amounts info from payment intent if available, or calculate it
    let discountAmount = 0
    const couponFromBody =
      typeof couponCode === "string" && couponCode.trim() ? couponCode.trim() : null
    let appliedCouponCode = couponFromBody
    let taxAmount = 0
    let shippingAmount = 0
    let taxRate: number | null = null
    let taxRegion: string | null = null
    let postalCode: string | null = null

    if (paymentIntentId) {
      try {
        const { stripe } = await import("@/lib/stripe")
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
        const discountFromMetadata = paymentIntent.metadata.discountAmount
        if (discountFromMetadata) {
          discountAmount = parseFloat(discountFromMetadata)
        }
        if (paymentIntent.metadata.couponCode) {
          appliedCouponCode = paymentIntent.metadata.couponCode
        }
        // Get tax info from payment intent metadata if available
        if (paymentIntent.metadata.taxAmount) {
          taxAmount = parseFloat(paymentIntent.metadata.taxAmount)
        }
        if (paymentIntent.metadata.taxRate) {
          taxRate = parseFloat(paymentIntent.metadata.taxRate)
        }
        if (paymentIntent.metadata.taxRegion) {
          taxRegion = paymentIntent.metadata.taxRegion
        }
        if (paymentIntent.metadata.postalCode) {
          postalCode = paymentIntent.metadata.postalCode
        }
        if (paymentIntent.metadata.shippingAmount) {
          shippingAmount = parseFloat(paymentIntent.metadata.shippingAmount)
        }
      } catch (error) {
        console.error("Failed to retrieve payment intent:", error)
      }
    }

    // Calculate subtotal after discount
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)

    // Extract postal code if needed for shipping calculation.
    if (!postalCode && shippingAddress) {
      const addressLines = shippingAddress.split("\n")
      if (addressLines.length >= 5) {
        const postalCodeLine = addressLines[4]
        if (postalCodeLine) {
          const match = postalCodeLine.match(/\d{4}(?:-\d{3})?/)
          if (match) {
            postalCode = match[0]
          }
        }
      }
    }

    // Prices already include IVA 23%, so tax is informational only.
    taxAmount = 0
    taxRate = 23.0
    taxRegion = "IVA 23% included"

    if (shippingAmount === 0 && postalCode) {
      try {
        const shipping = await calculateShipping(subtotalAfterDiscount, postalCode)
        shippingAmount = shipping.shippingAmount
      } catch (error) {
        console.error("Failed to calculate shipping:", error)
      }
    }

    // Calculate total (tax already included) + shipping
    const total = subtotalAfterDiscount + taxAmount + shippingAmount

    // Check for affiliate referral
    const referral = await getReferralByUserId(session.user.id)
    let affiliateReferralId: string | null = null

    if (referral) {
      affiliateReferralId = referral.id
    }

    // Increment coupon usage when payment is already settled (Stripe) or immediate;
    // MBWay / bank transfer defer until admin confirms.
    if (appliedCouponCode && !offlineMethod) {
      try {
        await db.coupon.updateMany({
          where: { code: appliedCouponCode },
          data: { usedCount: { increment: 1 } },
        })

        await db.pointsRedemption.updateMany({
          where: { couponCode: appliedCouponCode.toUpperCase().trim() },
          data: { status: "USED" },
        })
      } catch (error) {
        console.error("Failed to update coupon usage count:", error)
      }
    }

    const billingNifNorm =
      typeof billingNif === "string" && billingNif.trim() ? billingNif.trim() : null
    const billingAddressNorm =
      typeof billingAddress === "string" && billingAddress.trim()
        ? billingAddress.trim()
        : null

    let shopPaymentMethod: ShopPaymentMethod | null = null
    let manualPaymentStatus: ManualPaymentReviewStatus | null = null
    if (offlineMethod) {
      shopPaymentMethod =
        shopPaymentMethodRaw === "MBWAY" ? ShopPaymentMethod.MBWAY : ShopPaymentMethod.BANK_TRANSFER
      manualPaymentStatus = ManualPaymentReviewStatus.PENDING
    } else if (paymentIntentId) {
      shopPaymentMethod =
        shopPaymentMethodRaw === "STRIPE_KLARNA"
          ? ShopPaymentMethod.STRIPE_KLARNA
          : ShopPaymentMethod.STRIPE_CARD
    }

    // Create order
    const order = await db.order.create({
      data: {
        userId: session.user.id,
        total,
        shippingAddress: shippingAddress || null,
        billingNif: billingNifNorm,
        billingAddress: billingAddressNorm,
        paymentIntentId: paymentIntentId || null,
        shopPaymentMethod,
        manualPaymentStatus,
        appliedCouponCode: appliedCouponCode,
        affiliateReferralId,
        taxRate: taxRate,
        taxAmount: taxAmount,
        shippingAmount,
        taxRegion: taxRegion,
        items: {
          create: cartAfterClamp.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
        trainingItems: {
          create: cartAfterClamp.trainingItems.map((item) => ({
            sessionId: item.sessionId,
            programId: item.session.programId,
            bookingId: item.bookingId,
            price: item.session.program.price,
            quantity: 1,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        trainingItems: {
          include: {
            program: true,
            session: true,
          },
        },
      },
    })

    if (cartAfterClamp.items.length > 0) {
      await decrementStockForOrder(
        cartAfterClamp.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      )
    }

    await confirmTrainingBookings(cartAfterClamp.trainingItems)

    // Handle affiliate referral points (if not using webhook)
    // Note: This is a fallback - webhook handles Stripe orders, but this ensures it works for non-Stripe orders
    if (referral && !paymentIntentId && !offlineMethod) {
      // Only process if order wasn't created via Stripe (webhook handles Stripe orders)
      try {
        const currentReferral = await db.affiliateReferral.findUnique({
          where: { id: referral.id },
        })

        if (currentReferral && currentReferral.status === "PENDING") {
          // Activate referral and link first order
          await activateReferral(referral.id, order.id)
          
          // Award points for first order
          const firstOrderPoints = await calculatePoints("REFERRAL_FIRST_ORDER", Number(total))
          if (firstOrderPoints > 0) {
            const affiliate = await db.affiliate.findUnique({ 
              where: { id: referral.affiliateId } 
            })
            if (affiliate) {
              await awardPoints(
                affiliate.userId,
                firstOrderPoints,
                "AFFILIATE_PURCHASE",
                order.id,
                `Referral first order: ${total}€`
              )
            }
          }
        } else if (currentReferral && currentReferral.status === "ACTIVE") {
          // Repeat order - award points for repeat order
          const repeatOrderPoints = await calculatePoints("REFERRAL_REPEAT_ORDER", Number(total))
          if (repeatOrderPoints > 0) {
            const affiliate = await db.affiliate.findUnique({ 
              where: { id: referral.affiliateId } 
            })
            if (affiliate) {
              await awardPoints(
                affiliate.userId,
                repeatOrderPoints,
                "AFFILIATE_PURCHASE",
                order.id,
                `Referral repeat order: ${total}€`
              )
            }
          }
        }
      } catch (referralError) {
        console.error("Failed to process referral points:", referralError)
        // Don't fail order creation if referral processing fails
      }
    }

    // Award points to order owner for own purchase (if not using webhook)
    if (!paymentIntentId && !offlineMethod) {
      // Only if not using Stripe (webhook handles Stripe orders)
      try {
        const ownPurchasePoints = await calculatePoints("OWN_PURCHASE", Number(total))
        if (ownPurchasePoints > 0) {
          await awardPoints(
            session.user.id,
            ownPurchasePoints,
            "AFFILIATE_PURCHASE",
            order.id,
            `Purchase points: ${total}€`
          )
        }
      } catch (pointsError) {
        console.error("Failed to award purchase points:", pointsError)
        // Don't fail order creation if points fail
      }
    }

    // Clear cart
    await clearUserCart(cart.id)

    // Create notification for admin users when a new order is placed
    try {
      const offlineNote = offlineMethod
        ? " (awaiting MBWay / bank transfer — confirm payment in admin)"
        : ""
      await db.notification.create({
        data: {
          type: "ORDER",
          title: offlineMethod ? "New order — manual payment" : "New Order",
          message: `New order #${order.id.slice(0, 8)} from ${user?.name || user?.email || "Customer"} - ${formatPrice(total)}${offlineNote}`,
          linkUrl: `/admin/orders/${order.id}`,
          metadata: {
            orderId: order.id,
            userId: session.user.id,
            total: total.toString(),
            customerName: user?.name || null,
            customerEmail: user?.email || null,
          },
        },
      })
    } catch (notificationError) {
      // Log notification error but don't fail the order creation
      console.error("Failed to create order notification:", notificationError)
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Failed to create order:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}

