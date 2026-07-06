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
        phone: true,
        marketingConsent: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        certificationId: true,
        certificateUrl: true,
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

    // Fetch pending certification names for users who have certificationId but no certification (pending approval)
    const pendingCertificationIds = users
      .filter(u => u.certificationId && !u.certification)
      .map(u => u.certificationId!)
      .filter((id, index, self) => self.indexOf(id) === index) // unique IDs
    
    const pendingCertifications = pendingCertificationIds.length > 0
      ? await db.certification.findMany({
          where: { id: { in: pendingCertificationIds } },
          select: { id: true, name: true },
        })
      : []
    
    const pendingCertMap = new Map(
      pendingCertifications.map(cert => [cert.id, cert.name])
    )

    // Calculate total spent and order count for each user
    const usersWithStats = users.map((user) => {
      const orders = user.orders || []
      const totalSpent = orders.reduce(
        (sum, order) => sum + parseFloat(order.total?.toString() || "0"),
        0
      )
      const orderCount = orders.length

      // A certification is pending if certificateUrl exists
      let certification = user.certification as any
      if (certification && user.certificateUrl) {
        certification = { ...certification, pending: true }
      } else if (!certification && user.certificationId) {
        const pendingCertName = pendingCertMap.get(user.certificationId)
        if (pendingCertName) {
          certification = { id: user.certificationId, name: pendingCertName, pending: true }
        }
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        marketingConsent: user.marketingConsent,
        role: user.role,
        permissions: null, // Field doesn't exist in database, return null
        isActive: true, // Field doesn't exist in database, default to true
        lastLoginAt: null, // Field doesn't exist in database, return null
        certificationId: user.certificationId,
        certificateUrl: user.certificateUrl,
        certification: certification,
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

