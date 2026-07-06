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

    const pi = new URL(req.url).searchParams.get("payment_intent")
    if (!pi?.trim()) {
      return NextResponse.json({ error: "payment_intent required" }, { status: 400 })
    }

    const order = await db.order.findFirst({
      where: { paymentIntentId: pi.trim(), userId: session.user.id },
      select: { id: true, status: true },
    })

    return NextResponse.json(order)
  } catch (e) {
    console.error("lookup-by-payment-intent:", e)
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 })
  }
}
