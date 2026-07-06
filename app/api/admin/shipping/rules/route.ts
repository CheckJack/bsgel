import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rule = await db.shippingRule.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json(rule)
  } catch (error) {
    console.error("Failed to fetch shipping rules:", error)
    return NextResponse.json({ error: "Failed to fetch shipping rules" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { freeShippingThreshold } = body

    if (
      freeShippingThreshold !== null &&
      (typeof freeShippingThreshold !== "number" || freeShippingThreshold < 0)
    ) {
      return NextResponse.json(
        { error: "freeShippingThreshold must be null or a number >= 0" },
        { status: 400 }
      )
    }

    const existing = await db.shippingRule.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    })

    if (existing) {
      const updated = await db.shippingRule.update({
        where: { id: existing.id },
        data: { freeShippingThreshold },
      })
      return NextResponse.json(updated)
    }

    const created = await db.shippingRule.create({
      data: {
        name: "Default Portugal shipping rules",
        freeShippingThreshold,
        isActive: true,
      },
    })
    return NextResponse.json(created)
  } catch (error) {
    console.error("Failed to update shipping rules:", error)
    return NextResponse.json({ error: "Failed to update shipping rules" }, { status: 500 })
  }
}
