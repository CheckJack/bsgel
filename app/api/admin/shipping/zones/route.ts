import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

function isValidPostalRangeCode(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1000000 && value <= 9999999
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const zones = await db.shippingZone.findMany({
      orderBy: [{ postalCodeStart: "asc" }, { postalCodeEnd: "asc" }],
    })
    return NextResponse.json(zones)
  } catch (error) {
    console.error("Failed to fetch shipping zones:", error)
    return NextResponse.json({ error: "Failed to fetch shipping zones" }, { status: 500 })
  }
}

export async function POST(req: Request) {
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

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!isValidPostalRangeCode(postalCodeStart) || !isValidPostalRangeCode(postalCodeEnd)) {
      return NextResponse.json(
        { error: "Postal code start/end must be 7-digit numbers (e.g. 2685005)" },
        { status: 400 }
      )
    }
    if (postalCodeStart > postalCodeEnd) {
      return NextResponse.json(
        { error: "Postal code start cannot be greater than end" },
        { status: 400 }
      )
    }
    if (typeof shippingCost !== "number" || shippingCost < 0) {
      return NextResponse.json({ error: "Shipping cost must be >= 0" }, { status: 400 })
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

    const zone = await db.shippingZone.create({
      data: {
        name,
        postalCodeStart,
        postalCodeEnd,
        shippingCost,
        freeShippingThreshold: freeShippingThreshold ?? null,
        isActive: isActive !== false,
      },
    })
    return NextResponse.json(zone, { status: 201 })
  } catch (error) {
    console.error("Failed to create shipping zone:", error)
    return NextResponse.json({ error: "Failed to create shipping zone" }, { status: 500 })
  }
}
