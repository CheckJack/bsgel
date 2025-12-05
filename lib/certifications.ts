import { db } from "./db"

/**
 * Check if a user can purchase products from a specific category based on their certification
 * @param userId - The user's ID
 * @param categoryId - The category ID to check access for
 * @returns Object with canPurchase boolean and optional error message
 */
export async function canUserPurchaseFromCategory(
  userId: string,
  categoryId: string
): Promise<{ canPurchase: boolean; error?: string }> {
  try {
    // Get user with their certification
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        certification: {
          include: {
            certificationCategories: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return {
        canPurchase: false,
        error: "User not found",
      }
    }

    // Admin users can purchase any product regardless of certification
    if (user.role === "ADMIN") {
      return { canPurchase: true }
    }

    // If user has no certification, they can only purchase from categories without restrictions
    // Check if any certification restricts this category
    if (!user.certification) {
      // Check if this category requires a certification
      const categoryWithRestrictions = await db.certificationCategory.findFirst({
        where: {
          categoryId,
        },
      })

      if (categoryWithRestrictions) {
        // Category requires certification but user has none
        return {
          canPurchase: false,
          error: "This product category requires a certification. Please contact support to get certified.",
        }
      }

      // Category doesn't require certification, user can purchase
      return { canPurchase: true }
    }

    // User has certification - check if it allows this category
    const canPurchase = user.certification.certificationCategories.some(
      (cc) => cc.categoryId === categoryId
    )

    if (!canPurchase) {
      return {
        canPurchase: false,
        error: `Your ${user.certification.name} certification does not allow purchasing from this category. Please contact support if you need access.`,
      }
    }

    return { canPurchase: true }
  } catch (error) {
    console.error("Error checking certification access:", error)
    return {
      canPurchase: false,
      error: "An error occurred while checking certification access",
    }
  }
}

/**
 * Check if a user can purchase a specific product based on their certification
 * @param userId - The user's ID
 * @param productId - The product ID to check access for
 * @returns Object with canPurchase boolean and optional error message
 */
export async function canUserPurchaseProduct(
  userId: string,
  productId: string
): Promise<{ canPurchase: boolean; error?: string }> {
  try {
    // First check if user is admin - admins can purchase any product
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role === "ADMIN") {
      return { canPurchase: true }
    }

    // Get product with its category
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    })

    if (!product) {
      return {
        canPurchase: false,
        error: "Product not found",
      }
    }

    // If product has no category, allow purchase (no restrictions)
    if (!product.category) {
      return { canPurchase: true }
    }

    // Check category access
    return canUserPurchaseFromCategory(userId, product.category.id)
  } catch (error) {
    console.error("Error checking product certification access:", error)
    return {
      canPurchase: false,
      error: "An error occurred while checking certification access",
    }
  }
}

