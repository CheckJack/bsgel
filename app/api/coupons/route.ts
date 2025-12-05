import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const isActive = searchParams.get("isActive")

    const where: any = {}

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true"
    }

    const coupons = await db.coupon.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(coupons)
  } catch (error) {
    console.error("Failed to fetch coupons:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      minPurchaseIncludesDelivery,
      usageLimit,
      userUsageLimit,
      validFrom,
      validUntil,
      isActive,
      includedProducts,
      excludedProducts,
      includedCategories,
      excludedCategories,
    } = body

    // Log incoming data for debugging
    console.log("Creating coupon with data:", JSON.stringify({
      code,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      usageLimit,
      userUsageLimit,
      validFrom,
      validUntil,
      isActive,
    }, null, 2))

    // Validate required fields
    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: "Code, discount type, and discount value are required" },
        { status: 400 }
      )
    }

    // Validate coupon code format (alphanumeric and hyphens/underscores only)
    const normalizedCode = code.toUpperCase().trim()
    if (!/^[A-Z0-9_-]+$/.test(normalizedCode)) {
      return NextResponse.json(
        { error: "Coupon code can only contain letters, numbers, hyphens, and underscores" },
        { status: 400 }
      )
    }

    if (normalizedCode.length < 3 || normalizedCode.length > 50) {
      return NextResponse.json(
        { error: "Coupon code must be between 3 and 50 characters" },
        { status: 400 }
      )
    }

    // Validate discount value
    const discountValueNum = parseFloat(discountValue)
    if (isNaN(discountValueNum) || discountValueNum <= 0) {
      return NextResponse.json(
        { error: "Discount value must be a positive number" },
        { status: 400 }
      )
    }

    if (discountType === "PERCENTAGE" && discountValueNum > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      )
    }

    // Validate minimum purchase amount
    if (minPurchaseAmount !== null && minPurchaseAmount !== undefined) {
      const minPurchaseNum = parseFloat(minPurchaseAmount)
      if (isNaN(minPurchaseNum) || minPurchaseNum < 0) {
        return NextResponse.json(
          { error: "Minimum purchase amount must be a non-negative number" },
          { status: 400 }
        )
      }
    }

    // Validate maximum discount amount
    if (maxDiscountAmount !== null && maxDiscountAmount !== undefined) {
      const maxDiscountNum = parseFloat(maxDiscountAmount)
      if (isNaN(maxDiscountNum) || maxDiscountNum < 0) {
        return NextResponse.json(
          { error: "Maximum discount amount must be a non-negative number" },
          { status: 400 }
        )
      }
    }

    // Validate usage limits
    if (usageLimit !== null && usageLimit !== undefined) {
      const usageLimitNum = parseInt(usageLimit)
      if (isNaN(usageLimitNum) || usageLimitNum < 1) {
        return NextResponse.json(
          { error: "Usage limit must be a positive integer" },
          { status: 400 }
        )
      }
    }

    if (userUsageLimit !== null && userUsageLimit !== undefined) {
      const userUsageLimitNum = parseInt(userUsageLimit)
      if (isNaN(userUsageLimitNum) || userUsageLimitNum < 1) {
        return NextResponse.json(
          { error: "User usage limit must be a positive integer" },
          { status: 400 }
        )
      }
    }

    // Validate dates
    // Handle datetime-local format (YYYY-MM-DDTHH:mm) or ISO string
    let validFromDate: Date
    if (validFrom && validFrom !== "") {
      // datetime-local format is YYYY-MM-DDTHH:mm, which JavaScript Date can parse
      validFromDate = new Date(validFrom)
    } else {
      validFromDate = new Date()
    }
    
    let validUntilDate: Date | null = null
    if (validUntil && validUntil !== "") {
      validUntilDate = new Date(validUntil)
    }

    if (isNaN(validFromDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid valid from date" },
        { status: 400 }
      )
    }

    if (validUntilDate && isNaN(validUntilDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid valid until date" },
        { status: 400 }
      )
    }

    if (validUntilDate && validUntilDate <= validFromDate) {
      return NextResponse.json(
        { error: "Valid until date must be after valid from date" },
        { status: 400 }
      )
    }

    // Check if coupon code already exists
    const existingCoupon = await db.coupon.findUnique({
      where: { code: normalizedCode },
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      )
    }

    // Prepare data with proper type conversions
    // Convert empty strings to null for optional fields
    const getDecimalValue = (value: any): number | null => {
      if (!value || value === "" || value === null || value === undefined) return null
      const num = typeof value === 'number' ? value : parseFloat(value)
      return isNaN(num) ? null : num
    }

    const getIntValue = (value: any): number | null => {
      if (!value || value === "" || value === null || value === undefined) return null
      const num = typeof value === 'number' ? value : parseInt(value)
      return isNaN(num) ? null : num
    }

    const couponData: any = {
      code: normalizedCode,
      description: description?.trim() || null,
      discountType,
      discountValue: discountValueNum,
      minPurchaseAmount: getDecimalValue(minPurchaseAmount),
      maxDiscountAmount: getDecimalValue(maxDiscountAmount),
      minPurchaseIncludesDelivery: minPurchaseIncludesDelivery !== undefined ? Boolean(minPurchaseIncludesDelivery) : false,
      usageLimit: getIntValue(usageLimit),
      userUsageLimit: getIntValue(userUsageLimit),
      validFrom: validFromDate,
      validUntil: validUntilDate,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      includedProducts: Array.isArray(includedProducts) ? includedProducts : [],
      excludedProducts: Array.isArray(excludedProducts) ? excludedProducts : [],
      includedCategories: Array.isArray(includedCategories) ? includedCategories : [],
      excludedCategories: Array.isArray(excludedCategories) ? excludedCategories : [],
    }

    console.log("Prepared coupon data:", JSON.stringify(couponData, null, 2))

    console.log("Attempting to create coupon in database...")
    const coupon = await db.coupon.create({
      data: couponData,
    })
    console.log("Coupon created successfully:", coupon.id)

    return NextResponse.json(coupon, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create coupon:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
      name: error?.name,
    })
    // Try to serialize error, but handle circular references
    try {
      console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    } catch (e) {
      console.error("Error serialization failed, showing error directly:", error)
    }

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      )
    }

    // Check for specific Prisma errors
    if (error?.code === "P2021") {
      return NextResponse.json(
        { error: "Coupon table does not exist. Please run database migrations." },
        { status: 500 }
      )
    }

    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid reference in coupon data" },
        { status: 400 }
      )
    }

    // Return detailed error in development
    const errorResponse: any = {
      error: "Failed to create coupon",
    }
    
    if (process.env.NODE_ENV === "development") {
      errorResponse.details = error?.message
      errorResponse.code = error?.code
      errorResponse.meta = error?.meta
      if (error?.stack) {
        errorResponse.stack = error.stack.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
      }
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

