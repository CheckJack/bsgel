import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { codeSuffix } = await req.json().catch(() => ({}))
    const originalCoupon = await db.coupon.findUnique({
      where: { id: params.id },
    })

    if (!originalCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    // Generate new code
    const suffix = codeSuffix || "COPY"
    let newCode = `${originalCoupon.code}_${suffix}`
    let counter = 1

    // Ensure unique code
    while (await db.coupon.findUnique({ where: { code: newCode } })) {
      newCode = `${originalCoupon.code}_${suffix}${counter}`
      counter++
    }

    // Create duplicate with reset usage stats
    const duplicatedCoupon = await db.coupon.create({
      data: {
        code: newCode,
        description: originalCoupon.description,
        discountType: originalCoupon.discountType,
        discountValue: originalCoupon.discountValue,
        minPurchaseAmount: originalCoupon.minPurchaseAmount,
        maxDiscountAmount: originalCoupon.maxDiscountAmount,
        minPurchaseIncludesDelivery: originalCoupon.minPurchaseIncludesDelivery,
        usageLimit: originalCoupon.usageLimit,
        userUsageLimit: originalCoupon.userUsageLimit,
        validFrom: originalCoupon.validFrom,
        validUntil: originalCoupon.validUntil,
        isActive: false, // Start as inactive so admin can review
        includedProducts: originalCoupon.includedProducts,
        excludedProducts: originalCoupon.excludedProducts,
        includedCategories: originalCoupon.includedCategories,
        excludedCategories: originalCoupon.excludedCategories,
        usedCount: 0, // Reset usage count
      },
    })

    return NextResponse.json(duplicatedCoupon, { status: 201 })
  } catch (error: any) {
    console.error("Failed to duplicate coupon:", error)

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Failed to duplicate coupon" },
      { status: 500 }
    )
  }
}

