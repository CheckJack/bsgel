import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Check if certification exists
    const certification = await db.certification.findUnique({
      where: { id: params.id },
    })

    if (!certification) {
      return NextResponse.json(
        { error: "Certification not found" },
        { status: 404 }
      )
    }

    // Get total count
    const total = await db.user.count({
      where: {
        certificationId: params.id,
      },
    })

    // Calculate pagination
    const skip = (page - 1) * limit
    const totalPages = Math.ceil(total / limit)

    // Get users with this certification
    const users = await db.user.findMany({
      where: {
        certificationId: params.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        orders: {
          select: {
            total: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
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
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        totalSpent,
        orderCount,
      }
    })

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error: any) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

