import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - List all banned emails
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can view banned emails
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const bannedEmails = await db.bannedEmail.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(bannedEmails)
  } catch (error) {
    console.error("Failed to fetch banned emails:", error)
    return NextResponse.json(
      { error: "Failed to fetch banned emails" },
      { status: 500 }
    )
  }
}

// POST - Add email to ban list
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can ban emails
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { email, reason } = await req.json()

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check if email is already banned
    const existing = await db.bannedEmail.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Email is already banned" },
        { status: 400 }
      )
    }

    // Create banned email entry
    const bannedEmail = await db.bannedEmail.create({
      data: {
        email: normalizedEmail,
        reason: reason || null,
        bannedBy: session.user.id,
      },
    })

    return NextResponse.json(bannedEmail, { status: 201 })
  } catch (error: any) {
    console.error("Failed to ban email:", error)
    return NextResponse.json(
      { error: error.message || "Failed to ban email" },
      { status: 500 }
    )
  }
}

// DELETE - Remove email from ban list
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can unban emails
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check if email is banned
    const bannedEmail = await db.bannedEmail.findUnique({
      where: { email: normalizedEmail },
    })

    if (!bannedEmail) {
      return NextResponse.json(
        { error: "Email is not banned" },
        { status: 404 }
      )
    }

    // Remove from ban list
    await db.bannedEmail.delete({
      where: { email: normalizedEmail },
    })

    return NextResponse.json({ message: "Email unbanned successfully" })
  } catch (error: any) {
    console.error("Failed to unban email:", error)
    return NextResponse.json(
      { error: error.message || "Failed to unban email" },
      { status: 500 }
    )
  }
}

