import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/seo/product-seo";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin() || "https://biosculpture.pt";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/cart",
          "/checkout",
          "/login",
          "/register",
          "/orders",
          "/api/",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
