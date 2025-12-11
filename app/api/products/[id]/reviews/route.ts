import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET approved reviews for a product
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const sortBy = searchParams.get("sortBy") || "most-recent";
    const skip = (page - 1) * limit;

    // Verify product exists
    const product = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "highest-rated") {
      orderBy = { rating: "desc" };
    } else if (sortBy === "lowest-rated") {
      orderBy = { rating: "asc" };
    }

    // Get approved reviews only
    const [reviews, total] = await Promise.all([
      db.productReview.findMany({
        where: {
          productId: params.id,
          status: "APPROVED",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.productReview.count({
        where: {
          productId: params.id,
          status: "APPROVED",
        },
      }),
    ]);

    // Calculate rating breakdown
    const allApprovedReviews = await db.productReview.findMany({
      where: {
        productId: params.id,
        status: "APPROVED",
      },
      select: {
        rating: true,
      },
    });

    const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: allApprovedReviews.filter((r) => r.rating === stars).length,
    }));

    const averageRating =
      allApprovedReviews.length > 0
        ? allApprovedReviews.reduce((sum, r) => sum + r.rating, 0) /
          allApprovedReviews.length
        : 0;

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        reviewerName: review.user.name || review.user.email?.split("@")[0] || "Anonymous",
        rating: review.rating,
        title: review.title,
        content: review.content,
        productName: product.name,
        date: review.createdAt.toISOString().split("T")[0],
        verifiedBuyer: review.verifiedBuyer,
        companyResponse: review.companyResponse,
        helpfulCount: review.helpfulCount,
        notHelpfulCount: review.notHelpfulCount,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        overallRating: averageRating,
        totalReviews: total,
        breakdown,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST a new review (requires authentication)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to leave a review" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { rating, title, content } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Review content is required" },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if user has already reviewed this product
    const existingReview = await db.productReview.findFirst({
      where: {
        productId: params.id,
        userId: session.user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    // Check if user has purchased this product (for verified buyer status)
    const hasPurchased = await db.orderItem.findFirst({
      where: {
        productId: params.id,
        order: {
          userId: session.user.id,
          status: {
            in: ["DELIVERED", "SHIPPED"],
          },
        },
      },
    });

    // Create the review
    const review = await db.productReview.create({
      data: {
        productId: params.id,
        userId: session.user.id,
        rating: parseInt(rating),
        title: title?.trim(),
        content: content.trim(),
        verifiedBuyer: !!hasPurchased,
        status: "PENDING", // Requires admin approval
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create review" },
      { status: 500 }
    );
  }
}

