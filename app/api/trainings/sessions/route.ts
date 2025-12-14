import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get training sessions (public for active sessions, admin for all)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const programId = searchParams.get("programId")
    const adminView = searchParams.get("admin") === "true"
    const includePast = searchParams.get("includePast") === "true"

    // If admin view is requested, require admin authentication
    if (adminView) {
      if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const where: any = {}

    if (programId) {
      where.programId = programId
    }

    // For public view, only show active future sessions
    if (!adminView) {
      where.isActive = true
      if (!includePast) {
        where.startDate = {
          gte: new Date(),
        }
      }
    }

    const sessions = await db.trainingSession.findMany({
      where,
      include: {
        program: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    })

    const formatted = sessions.map((session) => ({
      id: session.id,
      programId: session.programId,
      program: {
        ...session.program,
        price: Number(session.program.price), // Convert Decimal to number
      },
      startDate: session.startDate,
      endDate: session.endDate,
      location: session.location,
      format: session.format,
      maxParticipants: session.maxParticipants,
      currentBookings: session._count.bookings,
      availableSpots: session.maxParticipants - session._count.bookings,
      isActive: session.isActive,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Failed to fetch training sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch training sessions" },
      { status: 500 }
    )
  }
}

// POST - Admin only: Create a new training session
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { programId, startDate, endDate, location, format, maxParticipants, isActive } = body

    // Validate required fields
    if (!programId) {
      return NextResponse.json(
        { error: "Program ID is required" },
        { status: 400 }
      )
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      )
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: "Start date cannot be in the past" },
        { status: 400 }
      )
    }

    // Check if program exists
    const program = await db.trainingProgram.findUnique({
      where: { id: programId },
    })

    if (!program) {
      return NextResponse.json(
        { error: "Training program not found" },
        { status: 404 }
      )
    }

    if (!maxParticipants || maxParticipants <= 0) {
      return NextResponse.json(
        { error: "Max participants must be greater than 0" },
        { status: 400 }
      )
    }

    const trainingSession = await db.trainingSession.create({
      data: {
        programId,
        startDate: start,
        endDate: end,
        location: location?.trim() || null,
        format: format && ["ONLINE", "PRESENTIAL", "HYBRID"].includes(format) ? format : "PRESENTIAL",
        maxParticipants: parseInt(maxParticipants),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        program: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
      },
    })

    const formatted = {
      id: trainingSession.id,
      programId: trainingSession.programId,
      program: trainingSession.program,
      startDate: trainingSession.startDate,
      endDate: trainingSession.endDate,
      location: trainingSession.location,
      maxParticipants: trainingSession.maxParticipants,
      currentBookings: 0,
      availableSpots: trainingSession.maxParticipants,
      isActive: trainingSession.isActive,
      createdAt: trainingSession.createdAt,
      updatedAt: trainingSession.updatedAt,
    }

    return NextResponse.json(formatted, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create training session:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to create training session" },
      { status: 500 }
    )
  }
}

