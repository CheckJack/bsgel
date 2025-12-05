import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can view users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role") // "ADMIN" or "USER" (customers)

    // Build where clause - filter by role if specified
    const where: any = {}
    if (role === "ADMIN") {
      where.role = "ADMIN"
    } else if (role === "USER") {
      where.role = "USER"
    }
    // If no role specified, return all users

    const users = await db.user.findMany({
      where,
      include: {
        orders: {
          select: {
            total: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate total spent and order count for each user
    const usersWithStats = users.map((user) => {
      const totalSpent = user.orders.reduce(
        (sum, order) => sum + parseFloat(order.total.toString()),
        0
      )
      const orderCount = user.orders.length

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        certification: user.certification,
        certificateUrl: user.certificateUrl,
        createdAt: user.createdAt,
        totalSpent,
        orderCount,
      }
    })

    return NextResponse.json(usersWithStats)
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

