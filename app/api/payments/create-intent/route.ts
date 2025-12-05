import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { canUserPurchaseProduct } from "@/lib/certifications"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { shippingAddress, couponCode } = await req.json()

    // Get user info to check if email is banned
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
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
            product: {
              include: {
                category: true,
              },
            },
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

    // Validate all cart items have required certifications
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

    // Delivery cost (fixed for now - should be calculated based on shipping address in production)
    const deliveryCost = 10.0

    // Validate and apply coupon if provided
    let discountAmount = 0
    let appliedCouponCode = null

    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() },
      })

      if (coupon && coupon.isActive) {
        const now = new Date()
        const isValidDate = 
          (!coupon.validFrom || now >= coupon.validFrom) &&
          (!coupon.validUntil || now <= coupon.validUntil)
        
        const isWithinUsageLimit = 
          !coupon.usageLimit || coupon.usedCount < coupon.usageLimit

        // Check product restrictions
        let meetsProductRestrictions = true
        if (coupon.includedProducts && coupon.includedProducts.length > 0) {
          const cartProductIds = cart.items.map(item => item.productId)
          meetsProductRestrictions = cartProductIds.every(id => 
            coupon.includedProducts.includes(id)
          ) && cart.items.length > 0
        }
        if (meetsProductRestrictions && coupon.excludedProducts && coupon.excludedProducts.length > 0) {
          const cartProductIds = cart.items.map(item => item.productId)
          meetsProductRestrictions = !cartProductIds.some(id => 
            coupon.excludedProducts.includes(id)
          )
        }

        // Check category restrictions
        let meetsCategoryRestrictions = true
        if (coupon.includedCategories && coupon.includedCategories.length > 0) {
          const cartCategoryIds = cart.items
            .map(item => item.product.categoryId)
            .filter(id => id !== null)
          meetsCategoryRestrictions = cartCategoryIds.every(id => 
            coupon.includedCategories.includes(id!)
          ) && cartCategoryIds.length > 0
        }
        if (meetsCategoryRestrictions && coupon.excludedCategories && coupon.excludedCategories.length > 0) {
          const cartCategoryIds = cart.items
            .map(item => item.product.categoryId)
            .filter(id => id !== null)
          meetsCategoryRestrictions = !cartCategoryIds.some(id => 
            coupon.excludedCategories.includes(id!)
          )
        }

        // Check minimum purchase amount (considering delivery if needed)
        const purchaseAmountForCheck = coupon.minPurchaseIncludesDelivery 
          ? subtotal + deliveryCost 
          : subtotal
        const meetsMinPurchase = 
          !coupon.minPurchaseAmount || purchaseAmountForCheck >= Number(coupon.minPurchaseAmount)

        if (isValidDate && isWithinUsageLimit && meetsMinPurchase && meetsProductRestrictions && meetsCategoryRestrictions) {
          // Calculate discount
          if (coupon.discountType === "PERCENTAGE") {
            discountAmount = (subtotal * Number(coupon.discountValue)) / 100
            if (coupon.maxDiscountAmount) {
              discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount))
            }
          } else {
            // FIXED discount
            discountAmount = Number(coupon.discountValue)
            discountAmount = Math.min(discountAmount, subtotal)
          }
          appliedCouponCode = coupon.code
        }
      }
    }

    // Calculate final total after discount
    const total = Math.max(0, subtotal - discountAmount)

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: "eur",
      metadata: {
        userId: session.user.id,
        cartId: cart.id,
        shippingAddress: shippingAddress || "",
        couponCode: appliedCouponCode || "",
        discountAmount: discountAmount.toFixed(2),
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Failed to create payment intent:", error)
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    )
  }
}

