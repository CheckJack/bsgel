import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get bookings (user sees their own, admin sees all)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    const where: any = {}

    // If admin, can filter by userId, otherwise only show own bookings
    if (session.user.role === "ADMIN" && userId) {
      where.userId = userId
    } else if (session.user.role !== "ADMIN") {
      where.userId = session.user.id
    }

    const bookings = await db.trainingBooking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        program: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
        session: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const formatted = bookings.map((booking) => ({
      id: booking.id,
      userId: booking.userId,
      user: booking.user,
      programId: booking.programId,
      program: {
        ...booking.program,
        price: Number(booking.program.price), // Convert Decimal to number
      },
      sessionId: booking.sessionId,
      session: booking.session,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Failed to fetch training bookings:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    return NextResponse.json(
      { error: error?.message || "Failed to fetch training bookings" },
      { status: 500 }
    )
  }
}

// POST - Create a new booking (authenticated users only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { sessionId, notes } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    // Check if session exists and is available
    const trainingSession = await db.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        program: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 }
      )
    }

    if (!trainingSession.isActive) {
      return NextResponse.json(
        { error: "Training session is not active" },
        { status: 400 }
      )
    }

    if (trainingSession.startDate < new Date()) {
      return NextResponse.json(
        { error: "Cannot book a session that has already started" },
        { status: 400 }
      )
    }

    // Check if session is full
    if (trainingSession._count.bookings >= trainingSession.maxParticipants) {
      return NextResponse.json(
        { error: "Training session is full" },
        { status: 400 }
      )
    }

    // Check if user already has a booking for this session
    const existingBooking = await db.trainingBooking.findFirst({
      where: {
        userId: session.user.id,
        sessionId: sessionId,
      },
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: "You already have a booking for this session" },
        { status: 400 }
      )
    }

    // Create booking
    const booking = await db.trainingBooking.create({
      data: {
        userId: session.user.id,
        programId: trainingSession.programId,
        sessionId: sessionId,
        notes: notes?.trim() || null,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        program: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
        session: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
      },
    })

    const formatted = {
      id: booking.id,
      userId: booking.userId,
      user: booking.user,
      programId: booking.programId,
      program: {
        ...booking.program,
        price: Number(booking.program.price), // Convert Decimal to number
      },
      sessionId: booking.sessionId,
      session: booking.session,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }

    return NextResponse.json(formatted, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create training booking:", error)

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "You already have a booking for this session" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error?.message || "Failed to create training booking" },
      { status: 500 }
    )
  }
}

