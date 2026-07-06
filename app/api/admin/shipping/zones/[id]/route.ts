import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

function isValidPostalRangeCode(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1000000 && value <= 9999999
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      postalCodeStart,
      postalCodeEnd,
      shippingCost,
      freeShippingThreshold,
      isActive,
    } = body

    if (postalCodeStart !== undefined && !isValidPostalRangeCode(postalCodeStart)) {
      return NextResponse.json({ error: "postalCodeStart must be a 7-digit number (e.g. 2685005)" }, { status: 400 })
    }
    if (postalCodeEnd !== undefined && !isValidPostalRangeCode(postalCodeEnd)) {
      return NextResponse.json({ error: "postalCodeEnd must be a 7-digit number (e.g. 2799999)" }, { status: 400 })
    }
    if (
      postalCodeStart !== undefined &&
      postalCodeEnd !== undefined &&
      postalCodeStart > postalCodeEnd
    ) {
      return NextResponse.json({ error: "postalCodeStart cannot be greater than postalCodeEnd" }, { status: 400 })
    }
    if (
      freeShippingThreshold !== undefined &&
      freeShippingThreshold !== null &&
      (typeof freeShippingThreshold !== "number" || freeShippingThreshold < 0)
    ) {
      return NextResponse.json(
        { error: "freeShippingThreshold must be null or >= 0" },
        { status: 400 }
      )
    }

    const zone = await db.shippingZone.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(postalCodeStart !== undefined ? { postalCodeStart } : {}),
        ...(postalCodeEnd !== undefined ? { postalCodeEnd } : {}),
        ...(shippingCost !== undefined ? { shippingCost } : {}),
        ...(freeShippingThreshold !== undefined ? { freeShippingThreshold } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    })

    return NextResponse.json(zone)
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Shipping zone not found" }, { status: 404 })
    }
    console.error("Failed to update shipping zone:", error)
    return NextResponse.json({ error: "Failed to update shipping zone" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const zone = await db.shippingZone.update({
      where: { id: params.id },
      data: { isActive: false },
    })
    return NextResponse.json(zone)
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Shipping zone not found" }, { status: 404 })
    }
    console.error("Failed to delete shipping zone:", error)
    return NextResponse.json({ error: "Failed to delete shipping zone" }, { status: 500 })
  }
}
