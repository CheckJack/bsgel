import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_ROUTE_DEFINITIONS } from "@/lib/seo/site-routes";
import { getSiteOrigin } from "@/lib/seo/product-seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin() || "https://biosculpture.pt";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = SITE_ROUTE_DEFINITIONS.filter(
    (route) =>
      !route.isDynamic &&
      !route.path.startsWith("/cart") &&
      !route.path.startsWith("/checkout") &&
      !route.path.startsWith("/login") &&
      !route.path.startsWith("/register") &&
      !route.path.startsWith("/dashboard") &&
      !route.path.startsWith("/orders") &&
      !route.path.startsWith("/admin")
  ).map((route) => ({
    url: `${origin}${route.path}`,
    lastModified: now,
    changeFrequency: route.path === "/" ? "daily" : "weekly",
    priority: route.path === "/" ? 1 : route.path === "/products" ? 0.9 : 0.7,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  let blogEntries: MetadataRoute.Sitemap = [];

  try {
    const products = await db.product.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    productEntries = products.map((product) => ({
      url: `${origin}/products/${encodeURIComponent(product.slug)}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("[sitemap] products failed:", error);
  }

  try {
    const blogs = await db.blog.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    });
    blogEntries = blogs.map((blog) => ({
      url: `${origin}/blog/${encodeURIComponent(blog.slug)}`,
      lastModified: blog.updatedAt || blog.publishedAt || now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("[sitemap] blogs failed:", error);
  }

  return [...staticRoutes, ...productEntries, ...blogEntries];
}
