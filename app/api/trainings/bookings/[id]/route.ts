import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get a specific booking
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const booking = await db.trainingBooking.findUnique({
      where: { id: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        program: true,
        session: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Users can only see their own bookings unless admin
    if (session.user.role !== "ADMIN" && booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Failed to fetch booking:", error)
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    )
  }
}

// PATCH - Update booking status (admin only) or cancel booking (user can cancel their own)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { status, notes } = body

    // Check if booking exists
    const existing = await db.trainingBooking.findUnique({
      where: { id: id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Users can only cancel their own bookings
    if (session.user.role !== "ADMIN") {
      if (existing.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // Users can only cancel (set to CANCELLED)
      if (status && status !== "CANCELLED") {
        return NextResponse.json(
          { error: "You can only cancel your own bookings" },
          { status: 403 }
        )
      }
    }

    const updateData: any = {}
    if (status !== undefined) {
      const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null
    }

    const booking = await db.trainingBooking.update({
      where: { id: id },
      data: updateData,
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

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Failed to update booking:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to update booking" },
      { status: 500 }
    )
  }
}

// DELETE - Delete booking (admin only, or user can delete their own cancelled bookings)
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

    // Check if booking exists
    const existing = await db.trainingBooking.findUnique({
      where: { id: id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Users can only delete their own cancelled bookings
    if (session.user.role !== "ADMIN") {
      if (existing.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      if (existing.status !== "CANCELLED") {
        return NextResponse.json(
          { error: "You can only delete cancelled bookings" },
          { status: 403 }
        )
      }
    }

    await db.trainingBooking.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: "Booking deleted successfully" })
  } catch (error: any) {
    console.error("Failed to delete booking:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to delete booking" },
      { status: 500 }
    )
  }
}

