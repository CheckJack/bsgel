import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, taxRate, postalCodePatterns, isActive, validFrom, validUntil } = body

    // Validate input
    if (name !== undefined && typeof name !== "string") {
      return NextResponse.json(
        { error: "Name must be a string" },
        { status: 400 }
      )
    }

    if (taxRate !== undefined && (typeof taxRate !== "number" || taxRate < 0 || taxRate > 100)) {
      return NextResponse.json(
        { error: "Tax rate must be a number between 0 and 100" },
        { status: 400 }
      )
    }

    if (postalCodePatterns !== undefined && (!Array.isArray(postalCodePatterns) || postalCodePatterns.length === 0)) {
      return NextResponse.json(
        { error: "Postal code patterns must be a non-empty array" },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (taxRate !== undefined) updateData.taxRate = taxRate
    if (postalCodePatterns !== undefined) updateData.postalCodePatterns = postalCodePatterns
    if (isActive !== undefined) updateData.isActive = isActive
    if (validFrom !== undefined) updateData.validFrom = validFrom ? new Date(validFrom) : new Date()
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null

    // Update tax region
    const taxRegion = await db.taxRegion.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(taxRegion)
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Tax region not found" },
        { status: 404 }
      )
    }
    console.error("Failed to update tax region:", error)
    return NextResponse.json(
      { error: "Failed to update tax region" },
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

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Soft delete by setting isActive to false
    const taxRegion = await db.taxRegion.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json(taxRegion)
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Tax region not found" },
        { status: 404 }
      )
    }
    console.error("Failed to delete tax region:", error)
    return NextResponse.json(
      { error: "Failed to delete tax region" },
      { status: 500 }
    )
  }
}

