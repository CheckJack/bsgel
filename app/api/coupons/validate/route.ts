import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code, subtotal, cartItems } = await req.json()

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      )
    }

    // Find the coupon
    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    })

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 404 }
      )
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "This coupon is not active" },
        { status: 400 }
      )
    }

    // Check if coupon is within valid date range
    const now = new Date()
    if (coupon.validFrom && now < coupon.validFrom) {
      return NextResponse.json(
        { error: "This coupon is not yet valid" },
        { status: 400 }
      )
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return NextResponse.json(
        { error: "This coupon has expired" },
        { status: 400 }
      )
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit" },
        { status: 400 }
      )
    }

    // Check user-specific usage limit
    if (coupon.userUsageLimit) {
      // Count how many times this user has used this coupon
      // We check notifications that have this coupon code in metadata for this user
      // Since Prisma JSON queries are limited, we fetch all ORDER notifications and filter
      const userNotifications = await db.notification.findMany({
        where: {
          type: "ORDER",
        },
      })

      // Filter notifications that have this coupon code for this user
      const userCouponCount = userNotifications.filter(
        (notification) => {
          const metadata = notification.metadata as any
          return metadata?.userId === session.user.id && metadata?.couponCode === coupon.code
        }
      ).length

      if (userCouponCount >= coupon.userUsageLimit) {
        return NextResponse.json(
          { error: `You have reached the maximum usage limit (${coupon.userUsageLimit}) for this coupon` },
          { status: 400 }
        )
      }
    }

    // Check product and category restrictions if cart items are provided
    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      // Check if any products are included (if so, only those products are allowed)
      if (coupon.includedProducts && coupon.includedProducts.length > 0) {
        const hasIncludedProduct = cartItems.some((item: any) => 
          coupon.includedProducts.includes(item.productId)
        )
        if (!hasIncludedProduct) {
          return NextResponse.json(
            { error: "This coupon is only valid for specific products" },
            { status: 400 }
          )
        }
        // Check if all cart items are in the included products list
        const allItemsIncluded = cartItems.every((item: any) =>
          coupon.includedProducts.includes(item.productId)
        )
        if (!allItemsIncluded) {
          return NextResponse.json(
            { error: "This coupon can only be applied to specific products. Please remove other items from your cart." },
            { status: 400 }
          )
        }
      }

      // Check if any products are excluded
      if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
        const hasExcludedProduct = cartItems.some((item: any) =>
          coupon.excludedProducts.includes(item.productId)
        )
        if (hasExcludedProduct) {
          return NextResponse.json(
            { error: "This coupon cannot be used with certain products in your cart" },
            { status: 400 }
          )
        }
      }

      // Check category restrictions - need to fetch product categories
      if (coupon.includedCategories && coupon.includedCategories.length > 0) {
        const productIds = cartItems.map((item: any) => item.productId)
        const products = await db.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, categoryId: true },
        })
        
        const allItemsInIncludedCategories = products.every((product) =>
          product.categoryId && coupon.includedCategories.includes(product.categoryId)
        )
        if (!allItemsInIncludedCategories) {
          return NextResponse.json(
            { error: "This coupon can only be applied to products in specific categories" },
            { status: 400 }
          )
        }
      }

      if (coupon.excludedCategories && coupon.excludedCategories.length > 0) {
        const productIds = cartItems.map((item: any) => item.productId)
        const products = await db.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, categoryId: true },
        })
        
        const hasExcludedCategory = products.some((product) =>
          product.categoryId && coupon.excludedCategories.includes(product.categoryId)
        )
        if (hasExcludedCategory) {
          return NextResponse.json(
            { error: "This coupon cannot be used with products from certain categories in your cart" },
            { status: 400 }
          )
        }
      }
    }

    // Check minimum purchase amount
    const subtotalNum = parseFloat(subtotal) || 0
    let minPurchaseAmount = coupon.minPurchaseAmount ? Number(coupon.minPurchaseAmount) : 0
    
    // If minPurchaseIncludesDelivery is true, we need to add delivery cost
    // For now, we'll use a fixed delivery cost of 10.0 (as seen in admin orders)
    // In a real scenario, this should be calculated based on shipping address
    const deliveryCost = 10.0
    const purchaseAmountForCheck = coupon.minPurchaseIncludesDelivery 
      ? subtotalNum + deliveryCost 
      : subtotalNum
    
    if (coupon.minPurchaseAmount && purchaseAmountForCheck < minPurchaseAmount) {
      const requiredAmount = minPurchaseAmount - (coupon.minPurchaseIncludesDelivery ? deliveryCost : 0)
      return NextResponse.json(
        { 
          error: `Minimum purchase amount of ${requiredAmount.toFixed(2)}€ is required for this coupon${coupon.minPurchaseIncludesDelivery ? ' (excluding delivery)' : ''}` 
        },
        { status: 400 }
      )
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (subtotalNum * Number(coupon.discountValue)) / 100
      // Apply max discount limit if set
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount))
      }
    } else {
      // FIXED discount
      discountAmount = Number(coupon.discountValue)
      // Don't allow discount to exceed subtotal
      discountAmount = Math.min(discountAmount, subtotalNum)
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountAmount: discountAmount.toFixed(2),
    })
  } catch (error) {
    console.error("Failed to validate coupon:", error)
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    )
  }
}

