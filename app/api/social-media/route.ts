import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month") // Format: YYYY-MM
    const status = searchParams.get("status")
    const platform = searchParams.get("platform")

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

    if (platform) {
      where.platform = platform
    }

    const posts = await db.socialMediaPost.findMany({
      where,
      orderBy: {
        scheduledDate: "asc",
      },
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error("Failed to fetch social media posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch social media posts" },
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
      platform,
      contentType,
      caption,
      images,
      videos,
      scheduledDate,
      status,
      hashtags,
      assignedReviewerId,
    } = body

    const postData: {
      platform: string;
      contentType: string;
      caption: string;
      images: string[];
      videos?: string[];
      scheduledDate: Date;
      status: string;
      hashtags: string[];
      createdBy: string;
      assignedReviewerId?: string;
    } = {
      platform: platform || "INSTAGRAM",
      contentType: contentType || "POST",
      caption: caption || "",
      images: images || [],
      scheduledDate: new Date(scheduledDate),
      status: status || "DRAFT",
      hashtags: hashtags || [],
      createdBy: session.user.id,
    }

    // Add videos if provided
    if (videos && Array.isArray(videos) && videos.length > 0) {
      postData.videos = videos
    }

    // Only set assignedReviewerId if status is PENDING_REVIEW
    if (status === "PENDING_REVIEW" && assignedReviewerId) {
      postData.assignedReviewerId = assignedReviewerId
    }

    const post = await db.socialMediaPost.create({
      data: postData,
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create social media post:", error)
    
    // Check if it's a table doesn't exist error
    if (error?.message?.includes("does not exist") || error?.code === "P2021") {
      return NextResponse.json(
        { 
          error: "Database table not found. Please run: npx prisma migrate dev --name add_social_media_posts",
          details: "The SocialMediaPost table needs to be created in the database. NEVER use 'db push' as it can delete all your data!",
          code: "TABLE_NOT_FOUND"
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create social media post",
        details: error?.message || "Unknown error",
        code: error?.code || "UNKNOWN"
      },
      { status: 500 }
    )
  }
}

