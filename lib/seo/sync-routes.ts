import { db } from "@/lib/db";
import { SITE_ROUTE_DEFINITIONS } from "@/lib/seo/site-routes";
import type { SitePageMediaItem } from "@/lib/seo/types";

export async function syncSitePageSeoRoutes() {
  for (const route of SITE_ROUTE_DEFINITIONS) {
    await db.sitePageSeo.upsert({
      where: { path: route.path },
      create: {
        path: route.path,
        name: route.name,
        title: route.defaultTitle,
        description: route.defaultDescription,
        permalink: route.path,
        isDynamic: route.isDynamic ?? false,
        media: route.defaultMedia ?? [],
      },
      update: {
        name: route.name,
        isDynamic: route.isDynamic ?? false,
      },
    });
  }
}

export function parseMediaJson(value: unknown): SitePageMediaItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is SitePageMediaItem =>
      item &&
      typeof item === "object" &&
      typeof (item as SitePageMediaItem).id === "string" &&
      typeof (item as SitePageMediaItem).src === "string"
  );
}
