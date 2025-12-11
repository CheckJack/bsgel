import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET approved reviews for a product (and user's own pending review if logged in)
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

    // Get session to check if user is logged in
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

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
    let reviews, total;
    try {
      // First, let's check all reviews for this product (for debugging)
      const allReviewsForProduct = await db.productReview.findMany({
        where: {
          productId: params.id,
        },
        select: {
          id: true,
          status: true,
          productId: true,
          rating: true,
        },
      });
      console.log(`[Reviews API] Product ${params.id}: All reviews (any status):`, allReviewsForProduct.length);
      console.log(`[Reviews API] Review statuses:`, allReviewsForProduct.map(r => ({ id: r.id, status: r.status, productId: r.productId })));

      [reviews, total] = await Promise.all([
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
            product: {
              select: {
                id: true,
                name: true,
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
      
      console.log(`[Reviews API] Product ${params.id}: Found ${reviews.length} approved reviews (total: ${total})`);

      // If user is logged in, also get their own pending review to show them it was submitted
      if (userId) {
        try {
          const userPendingReview = await db.productReview.findFirst({
            where: {
              productId: params.id,
              userId: userId,
              status: "PENDING",
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
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          });

          // Add user's pending review at the beginning if it exists
          if (userPendingReview) {
            reviews = [userPendingReview, ...reviews];
          }
        } catch (error: any) {
          // If query fails, just continue without user's pending review
          console.warn("Could not fetch user's pending review:", error.message);
        }
      }
    } catch (error: any) {
      // If table doesn't exist, return empty results
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn("ProductReview table may not exist yet");
        reviews = [];
        total = 0;
      } else {
        throw error;
      }
    }

    // Calculate rating breakdown
    let allApprovedReviews = [];
    try {
      allApprovedReviews = await db.productReview.findMany({
        where: {
          productId: params.id,
          status: "APPROVED",
        },
        select: {
          id: true,
          rating: true,
          productId: true,
          status: true,
        },
      });
      console.log(`[Reviews API] Product ${params.id}: All approved reviews for stats:`, allApprovedReviews.length);
      console.log(`[Reviews API] Approved review details:`, allApprovedReviews.map(r => ({ id: r.id, rating: r.rating, productId: r.productId, status: r.status })));
    } catch (error: any) {
      // If table doesn't exist, use empty array
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        allApprovedReviews = [];
      } else {
        throw error;
      }
    }

    const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: allApprovedReviews.filter((r) => r.rating === stars).length,
    }));

    const averageRating =
      allApprovedReviews.length > 0
        ? allApprovedReviews.reduce((sum, r) => sum + r.rating, 0) /
          allApprovedReviews.length
        : 0;

    // Debug: Log review count and statuses
    console.log(`[Reviews API] Product ${params.id}: Found ${reviews.length} approved reviews`);
    if (reviews.length > 0) {
      console.log(`[Reviews API] Review statuses:`, reviews.map(r => ({ id: r.id, status: r.status })));
    }

    // Map reviews to response format
    const mappedReviews = reviews.map((review) => ({
      id: review.id,
      reviewerName: review.user.name || review.user.email?.split("@")[0] || "Anonymous",
      rating: review.rating,
      title: review.title,
      content: review.content,
      productName: review.product?.name || product.name,
      productImage: review.product?.image || product.image,
      productId: review.product?.id || product.id,
      date: review.createdAt.toISOString().split("T")[0],
      verifiedBuyer: review.verifiedBuyer,
      companyResponse: review.companyResponse,
      helpfulCount: review.helpfulCount,
      notHelpfulCount: review.notHelpfulCount,
      status: review.status, // Include status so frontend can show "Pending" badge
      isOwnReview: userId ? review.userId === userId : false, // Mark if it's the current user's review
    }));

    return NextResponse.json({
      reviews: mappedReviews,
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
    let existingReview;
    try {
      existingReview = await db.productReview.findFirst({
        where: {
          productId: params.id,
          userId: session.user.id,
        },
      });
    } catch (error: any) {
      console.error("Error checking existing review:", error);
      // If the table doesn't exist, continue anyway
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn("ProductReview table may not exist yet");
      } else {
        throw error;
      }
    }

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    // Check if user has purchased this product (for verified buyer status)
    let hasPurchased = false;
    try {
      const orderItem = await db.orderItem.findFirst({
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
      hasPurchased = !!orderItem;
    } catch (error: any) {
      console.error("Error checking purchase status:", error);
      // If OrderItem table doesn't exist or relation fails, just continue without verified buyer status
      if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
        console.warn("OrderItem table or relation may not exist - continuing without verified buyer check");
        hasPurchased = false;
      } else {
        // For other errors, log but continue
        console.warn("Could not verify purchase status:", error.message);
        hasPurchased = false;
      }
    }

    // Create the review
    let review;
    try {
      review = await db.productReview.create({
        data: {
          productId: params.id,
          userId: session.user.id,
          rating: parseInt(rating),
          title: title?.trim() || null,
          content: content.trim(),
          verifiedBuyer: hasPurchased,
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
    } catch (error: any) {
      console.error("Failed to create review:", error);
      
      // Check if it's a schema/table issue
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: "Database table not found. Please run: npx prisma migrate dev --name add_product_reviews",
            details: "The ProductReview table needs to be created in the database."
          },
          { status: 500 }
        );
      }
      
      // Check if it's a relation issue
      if (error.code === 'P2003') {
        return NextResponse.json(
          { 
            error: "Invalid product or user reference",
            details: error.meta?.field_name || "Please check that the product and user exist."
          },
          { status: 400 }
        );
      }
      
      throw error;
    }

    return NextResponse.json({
      id: review.id,
      message: "Review submitted successfully! It will be visible after admin approval.",
      status: review.status,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create review:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to create review",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

