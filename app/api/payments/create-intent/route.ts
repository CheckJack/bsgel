import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { canUserPurchaseProduct } from "@/lib/certifications"
import { calculateShipping } from "@/lib/shipping"
import { clampCartItemsToStock, validateCartStock } from "@/lib/stock"
import {
  cartWithTrainingInclude,
  getCartSubtotal,
  isCartEmpty,
} from "@/lib/cart-training"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { shippingAddress, postalCode, couponCode, paymentMode, shippingStructured } = body
    const useKlarna = paymentMode === "klarna"

    // Validate input
    if (couponCode !== undefined && couponCode !== null && (typeof couponCode !== "string" || couponCode.trim().length === 0)) {
      return NextResponse.json(
        { error: "Coupon code must be a valid string if provided" },
        { status: 400 }
      )
    }

    if (shippingAddress !== undefined && shippingAddress !== null && typeof shippingAddress !== "string") {
      return NextResponse.json(
        { error: "Shipping address must be a valid string if provided" },
        { status: 400 }
      )
    }

    if (useKlarna) {
      const s = shippingStructured
      if (
        !s ||
        typeof s !== "object" ||
        typeof s.firstName !== "string" ||
        typeof s.lastName !== "string" ||
        typeof s.addressLine1 !== "string" ||
        typeof s.city !== "string" ||
        typeof s.postalCode !== "string"
      ) {
        return NextResponse.json(
          { error: "Klarna requires a complete shipping address (shippingStructured)" },
          { status: 400 }
        )
      }
    }

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
            available: stockError.available,
            productId: stockError.productId,
          },
          { status: 409 }
        )
      }

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
    }

    const subtotal = getCartSubtotal(cart)

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
          ? subtotal
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

    // Calculate subtotal after discount
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount)

    const shippingResult = postalCode
      ? await calculateShipping(subtotalAfterDiscount, postalCode)
      : {
          shippingAmount: 0,
          shippingZone: "Unknown zone",
          isFreeShipping: false,
          freeShippingThreshold: null,
        }

    // Prices already include 23% IVA, so no extra tax is added at checkout.
    const taxAmount = 0
    const taxRate = 23.0
    const taxRegion = "IVA 23% included"

    // Calculate final total (tax already included in product prices) + shipping
    const total = subtotalAfterDiscount + taxAmount + shippingResult.shippingAmount

    const shopPaymentMethodMeta = useKlarna ? "STRIPE_KLARNA" : "STRIPE_CARD"

    const intentCreateParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
      amount: Math.round(total * 100),
      currency: "eur",
      payment_method_types: useKlarna ? ["klarna"] : ["card"],
      metadata: {
        userId: session.user.id,
        cartId: cart.id,
        shippingAddress: shippingAddress || "",
        postalCode: postalCode || "",
        couponCode: appliedCouponCode || "",
        discountAmount: discountAmount.toFixed(2),
        shippingAmount: shippingResult.shippingAmount.toFixed(2),
        shippingZone: shippingResult.shippingZone,
        isFreeShipping: shippingResult.isFreeShipping ? "true" : "false",
        taxAmount: taxAmount.toFixed(2),
        taxRate: taxRate.toFixed(2),
        taxRegion: taxRegion,
        shopPaymentMethod: shopPaymentMethodMeta,
      },
    }

    if (useKlarna && shippingStructured && typeof shippingStructured === "object") {
      const s = shippingStructured as Record<string, string>
      const countryRaw = (s.country || "Portugal").toLowerCase()
      const country =
        countryRaw.includes("portugal") || countryRaw === "pt" ? "PT" : "PT"
      intentCreateParams.shipping = {
        name: `${s.firstName} ${s.lastName}`.trim(),
        address: {
          line1: s.addressLine1,
          line2: s.addressLine2 || undefined,
          city: s.city,
          state: s.district || undefined,
          postal_code: (s.postalCode || "").replace(/\s+/g, ""),
          country,
        },
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(intentCreateParams)

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

