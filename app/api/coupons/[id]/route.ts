import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
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

    const coupon = await db.coupon.findUnique({
      where: { id: params.id },
    })

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    return NextResponse.json(coupon)
  } catch (error) {
    console.error("Failed to fetch coupon:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const body = await req.json()
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

    // Check if coupon exists
    const existingCoupon = await db.coupon.findUnique({
      where: { id: params.id },
    })

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    // If code is being updated, check if new code already exists
    if (code && code !== existingCoupon.code) {
      const codeExists = await db.coupon.findUnique({
        where: { code: code.toUpperCase().trim() },
      })

      if (codeExists) {
        return NextResponse.json(
          { error: "A coupon with this code already exists" },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}

    if (code !== undefined) updateData.code = code.toUpperCase().trim()
    if (description !== undefined) updateData.description = description || null
    if (discountType !== undefined) updateData.discountType = discountType
    if (discountValue !== undefined) {
      const discountValueNum = parseFloat(discountValue)
      if (!isNaN(discountValueNum)) {
        updateData.discountValue = discountValueNum
      }
    }
    if (minPurchaseAmount !== undefined) {
      updateData.minPurchaseAmount = minPurchaseAmount 
        ? parseFloat(minPurchaseAmount) 
        : null
    }
    if (maxDiscountAmount !== undefined) {
      updateData.maxDiscountAmount = maxDiscountAmount 
        ? parseFloat(maxDiscountAmount) 
        : null
    }
    if (minPurchaseIncludesDelivery !== undefined) {
      updateData.minPurchaseIncludesDelivery = Boolean(minPurchaseIncludesDelivery)
    }
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit || null
    if (userUsageLimit !== undefined)
      updateData.userUsageLimit = userUsageLimit || null
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom)
    if (validUntil !== undefined)
      updateData.validUntil = validUntil ? new Date(validUntil) : null
    if (isActive !== undefined) updateData.isActive = isActive
    if (includedProducts !== undefined) {
      updateData.includedProducts = Array.isArray(includedProducts) ? includedProducts : []
    }
    if (excludedProducts !== undefined) {
      updateData.excludedProducts = Array.isArray(excludedProducts) ? excludedProducts : []
    }
    if (includedCategories !== undefined) {
      updateData.includedCategories = Array.isArray(includedCategories) ? includedCategories : []
    }
    if (excludedCategories !== undefined) {
      updateData.excludedCategories = Array.isArray(excludedCategories) ? excludedCategories : []
    }

    const coupon = await db.coupon.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(coupon)
  } catch (error: any) {
    console.error("Failed to update coupon:", error)

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const coupon = await db.coupon.findUnique({
      where: { id: params.id },
    })

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    await db.coupon.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Coupon deleted successfully" })
  } catch (error) {
    console.error("Failed to delete coupon:", error)
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    )
  }
}

