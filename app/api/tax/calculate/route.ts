import { NextResponse } from "next/server"
import { calculateTax } from "@/lib/tax"

export async function POST(req: Request) {
  try {
    const { subtotal, postalCode } = await req.json()

    // Validate input
    if (typeof subtotal !== "number" || subtotal < 0) {
      return NextResponse.json(
        { error: "Invalid subtotal. Must be a non-negative number." },
        { status: 400 }
      )
    }

    if (!postalCode || typeof postalCode !== "string") {
      return NextResponse.json(
        { error: "Postal code is required." },
        { status: 400 }
      )
    }

    // Calculate tax
    const result = await calculateTax(subtotal, postalCode)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to calculate tax:", error)
    return NextResponse.json(
      { error: "Failed to calculate tax" },
      { status: 500 }
    )
  }
}

