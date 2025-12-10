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

    // Check if user has confirmed certification
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        certification: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const certification = user.certification?.name as string | undefined
    const isPendingCertification = certification === "PROFESSIONAL_NON_CERTIFIED"

    if (isPendingCertification) {
      return NextResponse.json(
        { error: "Certification pending. Access denied." },
        { status: 403 }
      )
    }

    // Generate affiliate code from user email
    const affiliateCode = user.email?.split("@")[0].toUpperCase() + "2024" || "USER2024"
    const affiliateLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/?ref=${affiliateCode}`

    // For now, return mock data since affiliate tracking isn't implemented yet
    // TODO: Implement affiliate referral tracking in database
    // This would require:
    // 1. AffiliateReferral model with userId, referredUserId, orderId, commission, status
    // 2. Track referrals when users sign up with ?ref= parameter
    // 3. Track orders from referred users
    // 4. Calculate commissions

    const stats = {
      totalReferrals: 0,
      activeReferrals: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
      affiliateCode,
      affiliateLink,
      commissionRate: 15, // 15% commission
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to fetch affiliate data:", error)
    return NextResponse.json(
      { error: "Failed to fetch affiliate data" },
      { status: 500 }
    )
  }
}

