import { db } from "./db"
import { BRAND_LINE_CATEGORY_SLUGS } from "./brand-lines"

/**
 * Fallback retail category slugs used only if the Final Client system
 * certification is missing. Prefer DB-configured categories via
 * Certification.isSystem = true.
 */
export const RETAIL_CATEGORY_SLUGS = new Set<string>([
  "spa",
  ...BRAND_LINE_CATEGORY_SLUGS.ethos,
  ...BRAND_LINE_CATEGORY_SLUGS.gemini,
])

export const FINAL_CLIENT_CERTIFICATION_NAME = "Final Client"

export type PurchaseAccessCode =
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_INSUFFICIENT"
  | "USER_NOT_FOUND"
  | "PRODUCT_NOT_FOUND"
  | "ACCESS_CHECK_FAILED"

export type PurchaseAccessResult = {
  canPurchase: boolean
  error?: string
  code?: PurchaseAccessCode
  categoryName?: string
  certificationName?: string
}

export function isRetailCategorySlug(slug: string | null | undefined): boolean {
  if (!slug) return false
  return RETAIL_CATEGORY_SLUGS.has(slug.toLowerCase().trim())
}

/**
 * Category IDs allowed for non-professional (final) clients.
 * Sourced from the Final Client system certification; falls back to hardcoded
 * retail slugs if that record is missing.
 */
export async function getFinalClientCategoryIds(): Promise<Set<string>> {
  const finalClient = await db.certification.findFirst({
    where: { isSystem: true, isActive: true },
    select: {
      certificationCategories: {
        select: { categoryId: true },
      },
    },
  })

  if (finalClient) {
    return new Set(
      finalClient.certificationCategories.map((cc) => cc.categoryId)
    )
  }

  const retailCategories = await db.category.findMany({
    where: {
      slug: {
        in: Array.from(RETAIL_CATEGORY_SLUGS),
        mode: "insensitive",
      },
    },
    select: { id: true },
  })

  return new Set(retailCategories.map((c) => c.id))
}

async function isFinalClientAllowedCategory(
  categoryId: string,
  categorySlug?: string | null
): Promise<boolean> {
  const allowedIds = await getFinalClientCategoryIds()
  if (allowedIds.has(categoryId)) {
    return true
  }
  // Legacy fallback by slug when system cert has no matching row yet
  return isRetailCategorySlug(categorySlug)
}

/**
 * Check if a user can purchase products from a specific category based on their certification
 */
export async function canUserPurchaseFromCategory(
  userId: string,
  categoryId: string
): Promise<PurchaseAccessResult> {
  try {
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
        code: "USER_NOT_FOUND",
        error: "User not found",
      }
    }

    if (user.role === "ADMIN") {
      return { canPurchase: true }
    }

    // System certifications are never assigned; treat as no certification
    if (user.certification?.isSystem) {
      return {
        canPurchase: false,
        code: "ACCESS_CHECK_FAILED",
        error: "Invalid certification assignment",
      }
    }

    const category = await db.category.findUnique({
      where: { id: categoryId },
      select: { id: true, slug: true, name: true },
    })

    // Retail / Final Client categories are available to everyone
    if (await isFinalClientAllowedCategory(categoryId, category?.slug)) {
      return { canPurchase: true }
    }

    if (!user.certification) {
      const categoryWithRestrictions = await db.certificationCategory.findFirst({
        where: {
          categoryId,
          certification: { isSystem: false },
        },
      })

      if (categoryWithRestrictions) {
        return {
          canPurchase: false,
          code: "CERTIFICATION_REQUIRED",
          categoryName: category?.name,
          error:
            "This product category requires a certification. Please contact support to get certified.",
        }
      }

      return { canPurchase: true }
    }

    const canPurchase = user.certification.certificationCategories.some(
      (cc) => cc.categoryId === categoryId
    )

    if (!canPurchase) {
      return {
        canPurchase: false,
        code: "CERTIFICATION_INSUFFICIENT",
        categoryName: category?.name,
        certificationName: user.certification.name,
        error: `Your ${user.certification.name} certification does not allow purchasing from this category. Please contact support if you need access.`,
      }
    }

    return { canPurchase: true }
  } catch (error) {
    console.error("Error checking certification access:", error)
    return {
      canPurchase: false,
      code: "ACCESS_CHECK_FAILED",
      error: "An error occurred while checking certification access",
    }
  }
}

/**
 * Check if a user can purchase a specific product based on their certification
 */
export async function canUserPurchaseProduct(
  userId: string,
  productId: string
): Promise<PurchaseAccessResult> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role === "ADMIN") {
      return { canPurchase: true }
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    })

    if (!product) {
      return {
        canPurchase: false,
        code: "PRODUCT_NOT_FOUND",
        error: "Product not found",
      }
    }

    if (!product.category) {
      return { canPurchase: true }
    }

    if (
      await isFinalClientAllowedCategory(
        product.category.id,
        product.category.slug
      )
    ) {
      return { canPurchase: true }
    }

    return canUserPurchaseFromCategory(userId, product.category.id)
  } catch (error) {
    console.error("Error checking product certification access:", error)
    return {
      canPurchase: false,
      code: "ACCESS_CHECK_FAILED",
      error: "An error occurred while checking certification access",
    }
  }
}
