import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET reviews filtered by category, showcasingSection, or productId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const showcasingSection = searchParams.get("showcasingSection");
    const productId = searchParams.get("productId");
    const productIdsParam = searchParams.get("productIds");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "most-recent";
    const skip = (page - 1) * limit;

    // Get session to check if user is logged in
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Build where clause for products
    const productWhere: any = {};
    
    if (productId) {
      // If specific product, just get reviews for that product
      productWhere.id = productId;
    } else if (productIdsParam) {
      const parsedProductIds = productIdsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (parsedProductIds.length === 0) {
        return NextResponse.json({
          reviews: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
          stats: {
            overallRating: 0,
            totalReviews: 0,
            breakdown: [],
          },
        });
      }

      productWhere.id = { in: parsedProductIds };
    } else if (categoryId) {
      // Filter by category
      productWhere.categoryId = categoryId;
    } else if (showcasingSection) {
      // Filter by showcasing section
      productWhere.showcasingSections = {
        has: showcasingSection,
      };
    } else {
      // No filter provided: return reviews across all products.
      // Keep productWhere empty so all products are considered.
    }

    // First, get all product IDs that match the filter
    const products = await db.product.findMany({
      where: productWhere,
      select: {
        id: true,
        name: true,
      },
    });

    const productIds = products.map((p) => p.id);

    if (productIds.length === 0) {
      return NextResponse.json({
        reviews: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        stats: {
          overallRating: 0,
          totalReviews: 0,
          breakdown: [],
        },
      });
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "highest-rated") {
      orderBy = { rating: "desc" };
    } else if (sortBy === "lowest-rated") {
      orderBy = { rating: "asc" };
    }

    // Get approved reviews for these products
    let reviews: any[], total: number;
    try {
      [reviews, total] = await Promise.all([
        db.productReview.findMany({
          where: {
            productId: { in: productIds },
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
            productId: { in: productIds },
            status: "APPROVED",
          },
        }),
      ]);

      // If user is logged in, also get their own pending review
      if (userId) {
        try {
          const userPendingReview = await db.productReview.findFirst({
            where: {
              productId: { in: productIds },
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

          if (userPendingReview) {
            reviews = [userPendingReview, ...reviews];
          }
        } catch (error: any) {
          console.warn("Could not fetch user's pending review:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      reviews = [];
      total = 0;
    }

    // Calculate rating breakdown with a single grouped query
    let breakdown = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 }));
    let averageRating = 0;

    try {
      const breakdownRows = await db.$queryRaw<
        Array<{ rating: number; count: bigint }>
      >`
        SELECT rating, COUNT(*)::int as count
        FROM "ProductReview"
        WHERE "productId" = ANY(${productIds}::text[])
          AND status = 'APPROVED'
        GROUP BY rating
      `;

      const countByRating = new Map(
        breakdownRows.map((row) => [row.rating, Number(row.count)])
      );

      breakdown = [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: countByRating.get(stars) || 0,
      }));

      if (total > 0) {
        const weightedSum = breakdownRows.reduce(
          (sum, row) => sum + row.rating * Number(row.count),
          0
        );
        averageRating = weightedSum / total;
      }
    } catch {
      breakdown = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 }));
      averageRating = 0;
    }

    // Map reviews to response format
    const mappedReviews = reviews.map((review) => ({
      id: review.id,
      reviewerName: review.user.name || review.user.email?.split("@")[0] || "Anonymous",
      rating: review.rating,
      title: review.title,
      content: review.content,
      productName: review.product.name,
      productImage: review.product.image,
      productId: review.product.id,
      date: review.createdAt.toISOString().split("T")[0],
      verifiedBuyer: review.verifiedBuyer,
      companyResponse: review.companyResponse,
      helpfulCount: review.helpfulCount,
      notHelpfulCount: review.notHelpfulCount,
      status: review.status,
      isOwnReview: userId ? review.userId === userId : false,
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

