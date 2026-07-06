import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Public endpoint to get active training programs, or admin endpoint to get all
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const isActive = searchParams.get("isActive")
    const adminView = searchParams.get("admin") === "true"

    // If admin view is requested, require admin authentication
    if (adminView) {
      if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const where: any = {}
    
    // For public view, only show active programs
    if (!adminView) {
      where.isActive = true
    } else if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true"
    }

    let programs;
    try {
      programs = await db.trainingProgram.findMany({
        where,
        include: {
          sessions: {
            where: {
              isActive: true,
              startDate: {
                gte: new Date(), // Only future sessions
              },
            },
            orderBy: {
              startDate: "asc",
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
        orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      })
    } catch (error: any) {
      // If table doesn't exist, return empty array
      if (error?.code === "P2021" || error?.message?.includes("does not exist") || error?.message?.includes("TrainingProgram")) {
        console.warn("TrainingProgram table does not exist in database, returning empty array");
        return NextResponse.json([]);
      }
      throw error;
    }

    const formatted = programs.map((program) => ({
      id: program.id,
      title: program.title,
      description: program.description,
      content: program.content,
      days: program.days ? (Array.isArray(program.days) ? program.days : JSON.parse(program.days as string)) : null,
      totalHours: program.totalHours,
      displayOrder: program.displayOrder,
      price: Number(program.price), // Convert Decimal to number
      image: program.image,
      isActive: program.isActive,
      upcomingSessions: program.sessions.length,
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
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Failed to fetch training programs:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    return NextResponse.json(
      { error: error?.message || "Failed to fetch training programs" },
      { status: 500 }
    )
  }
}

// POST - Admin only: Create a new training program
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
    const { title, description, content, days, price, image, isActive, productIds } = body

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    // Validate days structure
    if (!days || !Array.isArray(days) || days.length === 0) {
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

    // Calculate total hours
    const totalHours = days.reduce((sum: number, day: any) => sum + (parseInt(day.hours) || 0), 0)

    if (!price || price < 0) {
      return NextResponse.json(
        { error: "Price must be greater than or equal to 0" },
        { status: 400 }
      )
    }

    // Validate product IDs if provided
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
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

    const maxOrder = await db.trainingProgram.aggregate({
      _max: { displayOrder: true },
    })
    const nextOrder = (maxOrder._max.displayOrder ?? 0) + 1

    let program;
    try {
      program = await db.trainingProgram.create({
        data: {
        title: title.trim(),
        description: description?.trim() || null,
        content: content?.trim() || null,
        days: days as any, // Store as JSON
        totalHours: totalHours,
        displayOrder: nextOrder,
        price: parseFloat(price),
        image: image || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        products: productIds && Array.isArray(productIds) && productIds.length > 0
          ? {
              create: productIds.map((p: any) => ({
                productId: typeof p === 'string' ? p : p.productId,
                quantity: typeof p === 'object' && p.quantity ? parseInt(p.quantity) : 1,
              })),
            }
          : undefined,
      },
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
          { error: "Training program table does not exist in database" },
          { status: 500 }
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

    return NextResponse.json(formatted, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create training program:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to create training program" },
      { status: 500 }
    )
  }
}


