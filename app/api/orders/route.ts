import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { canUserPurchaseProduct } from "@/lib/certifications"
import { formatPrice } from "@/lib/utils"
import { getReferralByUserId, activateReferral } from "@/lib/affiliate"
import { calculatePoints, awardPoints } from "@/lib/points"

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

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
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

    const { shippingAddress, paymentIntentId, couponCode } = await req.json()

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
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

    // Validate all cart items have required certifications (double-check before order creation)
    for (const item of cart.items) {
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

    // Calculate subtotal
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    )

    // Get discount from payment intent if available, or calculate it
    let discountAmount = 0
    let appliedCouponCode = couponCode || null

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
      } catch (error) {
        console.error("Failed to retrieve payment intent:", error)
      }
    }

    // Calculate total after discount
    const total = Math.max(0, subtotal - discountAmount)

    // Check for affiliate referral
    const referral = await getReferralByUserId(session.user.id)
    let affiliateReferralId: string | null = null

    if (referral) {
      affiliateReferralId = referral.id
    }

    // Increment coupon usage count if coupon was applied
    if (appliedCouponCode) {
      try {
        await db.coupon.updateMany({
          where: { code: appliedCouponCode },
          data: { usedCount: { increment: 1 } },
        })
        
        // Update redemption status to USED if this is a reward redemption coupon
        await db.pointsRedemption.updateMany({
          where: { couponCode: appliedCouponCode.toUpperCase().trim() },
          data: { status: "USED" },
        })
      } catch (error) {
        console.error("Failed to update coupon usage count:", error)
        // Don't fail order creation if coupon update fails
      }
    }

    // Create order
    const order = await db.order.create({
      data: {
        userId: session.user.id,
        total,
        shippingAddress: shippingAddress || null,
        paymentIntentId: paymentIntentId || null,
        affiliateReferralId,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Handle affiliate referral points (if not using webhook)
    // Note: This is a fallback - webhook handles Stripe orders, but this ensures it works for non-Stripe orders
    if (referral && !paymentIntentId) {
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
    if (!paymentIntentId) {
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
    await db.cartItem.deleteMany({
      where: { cartId: cart.id },
    })

    // Create notification for admin users when a new order is placed
    try {
      await db.notification.create({
        data: {
          type: "ORDER",
          title: "New Order",
          message: `New order #${order.id.slice(0, 8)} from ${user?.name || user?.email || "Customer"} - ${formatPrice(total)}`,
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

