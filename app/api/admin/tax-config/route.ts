import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const taxRegions = await db.taxRegion.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(taxRegions)
  } catch (error) {
    console.error("Failed to fetch tax regions:", error)
    return NextResponse.json(
      { error: "Failed to fetch tax regions" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, taxRate, postalCodePatterns, isActive, validFrom, validUntil } = body

    // Validate input
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required and must be a string" },
        { status: 400 }
      )
    }

    if (typeof taxRate !== "number" || taxRate < 0 || taxRate > 100) {
      return NextResponse.json(
        { error: "Tax rate must be a number between 0 and 100" },
        { status: 400 }
      )
    }

    if (!Array.isArray(postalCodePatterns) || postalCodePatterns.length === 0) {
      return NextResponse.json(
        { error: "Postal code patterns must be a non-empty array" },
        { status: 400 }
      )
    }

    // Create tax region
    const taxRegion = await db.taxRegion.create({
      data: {
        name,
        taxRate,
        postalCodePatterns,
        isActive: isActive !== undefined ? isActive : true,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    })

    return NextResponse.json(taxRegion, { status: 201 })
  } catch (error) {
    console.error("Failed to create tax region:", error)
    return NextResponse.json(
      { error: "Failed to create tax region" },
      { status: 500 }
    )
  }
}

