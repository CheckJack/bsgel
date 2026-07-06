import { NextResponse } from "next/server"
import { calculateShipping } from "@/lib/shipping"

export async function POST(req: Request) {
  try {
    const { subtotal, postalCode } = await req.json()

    if (typeof subtotal !== "number" || subtotal < 0) {
      return NextResponse.json(
        { error: "Invalid subtotal. Must be a non-negative number." },
        { status: 400 }
      )
    }

    if (!postalCode || typeof postalCode !== "string") {
      return NextResponse.json({ error: "Postal code is required." }, { status: 400 })
    }

    const result = await calculateShipping(subtotal, postalCode)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to calculate shipping:", error)
    return NextResponse.json({ error: "Failed to calculate shipping" }, { status: 500 })
  }
}
