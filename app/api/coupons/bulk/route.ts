import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { action, couponIds } = await req.json()

    if (!action || !Array.isArray(couponIds) || couponIds.length === 0) {
      return NextResponse.json(
        { error: "Action and coupon IDs are required" },
        { status: 400 }
      )
    }

    let result
    switch (action) {
      case "delete":
        result = await db.coupon.deleteMany({
        where: { id: { in: couponIds } },
      })
        return NextResponse.json({
          message: `Successfully deleted ${result.count} coupon(s)`,
          count: result.count,
        })

      case "activate":
        result = await db.coupon.updateMany({
        where: { id: { in: couponIds } },
        data: { isActive: true },
      })
        return NextResponse.json({
          message: `Successfully activated ${result.count} coupon(s)`,
          count: result.count,
        })

      case "deactivate":
        result = await db.coupon.updateMany({
        where: { id: { in: couponIds } },
        data: { isActive: false },
      })
        return NextResponse.json({
          message: `Successfully deactivated ${result.count} coupon(s)`,
          count: result.count,
        })

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'delete', 'activate', or 'deactivate'" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Failed to perform bulk operation:", error)
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    )
  }
}

