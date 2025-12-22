import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get a specific training session
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
  try {
    const session = await db.trainingSession.findUnique({
      where: { id: id },
      include: {
        program: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 }
      )
    }

    const formatted = {
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
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Failed to fetch training session:", error)
    return NextResponse.json(
      { error: "Failed to fetch training session" },
      { status: 500 }
    )
  }
}

// PUT - Admin only: Update a training session
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { startDate, endDate, location, format, maxParticipants, isActive } = body

    // Check if session exists
    const existing = await db.trainingSession.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (startDate !== undefined && endDate !== undefined) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (start >= end) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 }
        )
      }

      updateData.startDate = start
      updateData.endDate = end
    } else if (startDate !== undefined || endDate !== undefined) {
      return NextResponse.json(
        { error: "Both start date and end date must be provided together" },
        { status: 400 }
      )
    }

    if (location !== undefined) {
      updateData.location = location?.trim() || null
    }

    if (format !== undefined) {
      if (["ONLINE", "PRESENTIAL", "HYBRID"].includes(format)) {
        updateData.format = format
      } else {
        return NextResponse.json(
          { error: "Invalid format. Must be ONLINE, PRESENTIAL, or HYBRID" },
          { status: 400 }
        )
      }
    }

    if (maxParticipants !== undefined) {
      if (maxParticipants <= 0) {
        return NextResponse.json(
          { error: "Max participants must be greater than 0" },
          { status: 400 }
        )
      }

      // Check if new max is less than current bookings
      if (maxParticipants < existing._count.bookings) {
        return NextResponse.json(
          { error: `Cannot set max participants below current bookings (${existing._count.bookings})` },
          { status: 400 }
        )
      }

      updateData.maxParticipants = parseInt(maxParticipants)
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive)
    }

    const updated = await db.trainingSession.update({
      where: { id: id },
      data: updateData,
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
    })

    const formatted = {
      id: updated.id,
      programId: updated.programId,
      program: updated.program,
      startDate: updated.startDate,
      endDate: updated.endDate,
      location: updated.location,
      format: updated.format,
      maxParticipants: updated.maxParticipants,
      currentBookings: updated._count.bookings,
      availableSpots: updated.maxParticipants - updated._count.bookings,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Failed to update training session:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to update training session" },
      { status: 500 }
    )
  }
}

// DELETE - Admin only: Delete a training session
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if session exists
    const existing = await db.trainingSession.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 }
      )
    }

    // Check if there are bookings
    if (existing._count.bookings > 0) {
      return NextResponse.json(
        { error: "Cannot delete training session with existing bookings" },
        { status: 400 }
      )
    }

    await db.trainingSession.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: "Training session deleted successfully" })
  } catch (error: any) {
    console.error("Failed to delete training session:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to delete training session" },
      { status: 500 }
    )
  }
}

