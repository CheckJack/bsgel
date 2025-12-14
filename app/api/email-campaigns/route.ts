import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month") // Format: YYYY-MM
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}

    if (month) {
      const [year, monthNum] = month.split("-")
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59)
      where.scheduledDate = {
        gte: startDate,
        lte: endDate,
      }
    }

    if (status) {
      where.status = status
    }

    const campaigns = await db.emailCampaign.findMany({
      where,
      orderBy: {
        scheduledDate: "asc",
      },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error("Failed to fetch email campaigns:", error)
    return NextResponse.json(
      { error: "Failed to fetch email campaigns" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      subject,
      content,
      pdfUrl,
      scheduledDate,
      status,
      recipientList,
      recipientType,
      assignedReviewerId,
    } = body

    const campaignData: {
      subject: string;
      content: string;
      pdfUrl?: string | null;
      scheduledDate?: Date | null;
      status: string;
      recipientList: string[];
      recipientType: string;
      createdBy: string;
      assignedReviewerId?: string;
    } = {
      subject: subject || "",
      content: content || "",
      pdfUrl: pdfUrl || null,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      status: status || "DRAFT",
      recipientList: recipientList || [],
      recipientType: recipientType || "ALL",
      createdBy: session.user.id,
    }

    // Only set assignedReviewerId if status is PENDING_REVIEW
    if (status === "PENDING_REVIEW" && assignedReviewerId) {
      campaignData.assignedReviewerId = assignedReviewerId
    }

    const campaign = await db.emailCampaign.create({
      data: campaignData,
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create email campaign:", error)
    
    // Check if it's a table doesn't exist error
    if (error?.message?.includes("does not exist") || error?.code === "P2021") {
      return NextResponse.json(
        { 
          error: "Database table not found. Please run: npx prisma migrate dev --name add_email_campaigns",
          details: "The EmailCampaign table needs to be created in the database. NEVER use 'db push' as it can delete all your data!",
          code: "TABLE_NOT_FOUND"
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create email campaign",
        details: error?.message || "Unknown error",
        code: error?.code || "UNKNOWN"
      },
      { status: 500 }
    )
  }
}

