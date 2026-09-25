import { BlogStatus } from "@prisma/client"

export const ADMIN_BLOG_STATUSES: BlogStatus[] = ["DRAFT", "PUBLISHED"]

const LEGACY_REVIEW_STATUSES: BlogStatus[] = [
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
]

export function normalizeBlogStatus(status: string | null | undefined): BlogStatus {
  if (status === "PUBLISHED") {
    return "PUBLISHED"
  }

  if (status && LEGACY_REVIEW_STATUSES.includes(status as BlogStatus)) {
    return "DRAFT"
  }

  return "DRAFT"
}

export function toAdminBlogStatus(status: string | null | undefined): "DRAFT" | "PUBLISHED" {
  return normalizeBlogStatus(status) === "PUBLISHED" ? "PUBLISHED" : "DRAFT"
}

export function isValidBlogStatus(status: string): status is BlogStatus {
  return ADMIN_BLOG_STATUSES.includes(status as BlogStatus)
}

export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function slugFromTitle(title: string): string {
  return normalizeSlug(title)
}

export function applyPublishState(
  status: BlogStatus,
  existingPublishedAt: Date | null
): { status: BlogStatus; publishedAt: Date | null } {
  if (status === "PUBLISHED") {
    return {
      status: "PUBLISHED",
      publishedAt: existingPublishedAt ?? new Date(),
    }
  }

  return {
    status: "DRAFT",
    publishedAt: null,
  }
}

export const PUBLIC_BLOG_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  author: true,
  image: true,
  heroImage: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const
