import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { orderedIds } = body as { orderedIds?: string[] }
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds is required" }, { status: 400 })
    }

    await db.$transaction(
      orderedIds.map((id, index) =>
        db.trainingProgram.update({
          where: { id },
          data: { displayOrder: index + 1 },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to reorder training programs:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to reorder training programs" },
      { status: 500 }
    )
  }
}
