import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get a specific training program (public)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
  try {
    let program;
    try {
      program = await db.trainingProgram.findUnique({
        where: { id: id },
      include: {
        sessions: {
          where: {
            isActive: true,
            startDate: {
              gte: new Date(),
            },
          },
          orderBy: {
            startDate: "asc",
          },
          include: {
            _count: {
              select: {
                bookings: true,
              },
            },
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
            sessions: true,
          },
        },
      },
    })
    } catch (error: any) {
      // If table doesn't exist, return 404
      if (error?.code === "P2021" || error?.message?.includes("does not exist") || error?.message?.includes("TrainingProgram")) {
        console.warn("TrainingProgram table does not exist in database");
        return NextResponse.json(
          { error: "Training program not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    if (!program) {
      return NextResponse.json(
        { error: "Training program not found" },
        { status: 404 }
      )
    }

    // Format sessions with availability
    const formattedSessions = program.sessions.map((session) => ({
      id: session.id,
      startDate: session.startDate,
      endDate: session.endDate,
      location: session.location,
      maxParticipants: session.maxParticipants,
      availableSpots: session.maxParticipants - session._count.bookings,
      currentBookings: session._count.bookings,
    }))

    const formatted = {
      id: program.id,
      title: program.title,
      description: program.description,
      content: program.content,
      days: program.days ? (Array.isArray(program.days) ? program.days : JSON.parse(program.days as string)) : null,
      totalHours: program.totalHours,
      price: Number(program.price), // Convert Decimal to number
      image: program.image,
      isActive: program.isActive,
      sessions: formattedSessions,
      totalBookings: program._count.bookings,
      includedProducts: program.products.map((tp) => ({
        id: tp.product.id,
        name: tp.product.name,
        price: Number(tp.product.price),
        image: tp.product.image,
        quantity: tp.quantity,
      })),
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Failed to fetch training program:", error)
    return NextResponse.json(
      { error: "Failed to fetch training program" },
      { status: 500 }
    )
  }
}

// PUT - Admin only: Update a training program
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
    const { title, description, content, days, price, image, isActive, productIds } = body

    // Check if program exists
    let existing;
    try {
      existing = await db.trainingProgram.findUnique({
        where: { id: id },
      })
    } catch (error: any) {
      if (error?.code === "P2021" || error?.message?.includes("does not exist") || error?.message?.includes("TrainingProgram")) {
        return NextResponse.json(
          { error: "Training program not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Training program not found" },
        { status: 404 }
      )
    }

    // Validate days if provided
    if (days !== undefined) {
      if (!Array.isArray(days) || days.length === 0) {
        return NextResponse.json(
          { error: "At least one day is required" },
          { status: 400 }
        )
      }

      // Validate each day
      for (const day of days) {
        if (!day.day || !day.hours || day.hours <= 0) {
          return NextResponse.json(
            { error: "Each day must have a day number and hours greater than 0" },
            { status: 400 }
          )
        }
      }
    }

    if (price !== undefined && price < 0) {
      return NextResponse.json(
        { error: "Price must be greater than or equal to 0" },
        { status: 400 }
      )
    }

    // Validate product IDs if provided
    if (productIds !== undefined && Array.isArray(productIds) && productIds.length > 0) {
      const products = await db.product.findMany({
        where: {
          id: {
            in: productIds.map((p: any) => (typeof p === 'string' ? p : p.productId)),
          },
        },
      })

      if (products.length !== productIds.length) {
        return NextResponse.json(
          { error: "One or more product IDs are invalid" },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (content !== undefined) updateData.content = content?.trim() || null
    if (days !== undefined) {
      updateData.days = days as any
      // Calculate total hours
      const totalHours = days.reduce((sum: number, day: any) => sum + (parseInt(day.hours) || 0), 0)
      updateData.totalHours = totalHours
    }
    if (price !== undefined) updateData.price = parseFloat(price)
    if (image !== undefined) updateData.image = image || null
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    // Handle product associations
    if (productIds !== undefined) {
      // Delete existing product associations
      await db.trainingProgramProduct.deleteMany({
        where: { trainingProgramId: id },
      })

      // Create new product associations if provided
      if (Array.isArray(productIds) && productIds.length > 0) {
        updateData.products = {
          create: productIds.map((p: any) => ({
            productId: typeof p === 'string' ? p : p.productId,
            quantity: typeof p === 'object' && p.quantity ? parseInt(p.quantity) : 1,
          })),
        }
      }
    }

    let program;
    try {
      program = await db.trainingProgram.update({
        where: { id: id },
        data: updateData,
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
              },
            },
          },
        },
      },
    })
    } catch (error: any) {
      if (error?.code === "P2021" || error?.message?.includes("does not exist") || error?.message?.includes("TrainingProgram")) {
        return NextResponse.json(
          { error: "Training program not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    const formatted = {
      ...program,
      price: Number(program.price),
      includedProducts: program.products.map((tp) => ({
        id: tp.product.id,
        name: tp.product.name,
        price: Number(tp.product.price),
        image: tp.product.image,
        quantity: tp.quantity,
      })),
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Failed to update training program:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to update training program" },
      { status: 500 }
    )
  }
}

// DELETE - Admin only: Delete a training program
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

    // Check if program exists
    let existing;
    try {
      existing = await db.trainingProgram.findUnique({
        where: { id: id },
        include: {
          _count: {
            select: {
              bookings: true,
              sessions: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (error?.code === "P2021" || error?.message?.includes("does not exist") || error?.message?.includes("TrainingProgram")) {
        return NextResponse.json(
          { error: "Training program not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Training program not found" },
        { status: 404 }
      )
    }

    // Check if there are bookings
    if (existing._count.bookings > 0) {
      return NextResponse.json(
        { error: "Cannot delete training program with existing bookings" },
        { status: 400 }
      )
    }

    try {
      await db.trainingProgram.delete({
        where: { id: id },
      })
    } catch (error: any) {
      if (error?.code === "P2021" || error?.message?.includes("does not exist") || error?.message?.includes("TrainingProgram")) {
        return NextResponse.json(
          { error: "Training program not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ message: "Training program deleted successfully" });
  } catch (error: any) {
    console.error("Failed to delete training program:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to delete training program" },
      { status: 500 }
    )
  }
}

