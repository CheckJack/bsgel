import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    console.log("🔍 [Users API] Session check:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userEmail: session?.user?.email,
    })

    if (!session?.user?.id) {
      console.error("❌ [Users API] No session or user ID")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can view users
    if (!session.user.role || session.user.role !== "ADMIN") {
      console.error("❌ [Users API] User is not admin. Role:", session.user.role)
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

    // Use select to only get fields that exist in the database
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            total: true,
          },
        },
        certification: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate total spent and order count for each user
    const usersWithStats = users.map((user) => {
      const orders = user.orders || []
      const totalSpent = orders.reduce(
        (sum, order) => sum + parseFloat(order.total?.toString() || "0"),
        0
      )
      const orderCount = orders.length

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: null, // Field doesn't exist in database, return null
        isActive: true, // Field doesn't exist in database, default to true
        lastLoginAt: null, // Field doesn't exist in database, return null
        certification: null, // Not fetched to avoid schema issues
        certificateUrl: null, // Not fetched to avoid schema issues
        createdAt: user.createdAt,
        totalSpent,
        orderCount,
      }
    })

    console.log("✅ [Users API] Returning", usersWithStats.length, "users")
    return NextResponse.json(usersWithStats)
  } catch (error: any) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users", details: error?.message || String(error) },
      { status: 500 }
    )
  }
}

