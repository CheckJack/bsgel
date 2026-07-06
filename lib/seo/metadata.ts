import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { findRouteDefinition, SITE_ROUTE_DEFINITIONS } from "@/lib/seo/site-routes";
import { parseMediaJson } from "@/lib/seo/sync-routes";

const SITE_NAME = "Bio Sculpture";
const TITLE_MAX = 65;
const DESC_MAX = 160;

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function matchDynamicPath(pathname: string): string | null {
  const exact = findRouteDefinition(pathname);
  if (exact) return pathname;

  for (const route of SITE_ROUTE_DEFINITIONS) {
    if (!route.isDynamic || !route.path.includes("[")) continue;
    const pattern = route.path.replace(/\[[^\]]+\]/g, "[^/]+");
    const re = new RegExp(`^${pattern}$`);
    if (re.test(pathname)) return route.path;
  }
  return null;
}

const getCachedPageSeo = unstable_cache(
  async (path: string) => db.sitePageSeo.findUnique({ where: { path } }),
  ["site-page-seo"],
  { revalidate: 300 }
);

export async function getMetadataForPath(pathname: string): Promise<Metadata> {
  const normalized = pathname.split("?")[0] || "/";
  const routeKey = matchDynamicPath(normalized);

  let record = routeKey ? await getCachedPageSeo(routeKey) : null;

  if (!record && routeKey) {
    const def = findRouteDefinition(routeKey);
    if (def) {
      return {
        title: truncate(def.defaultTitle, TITLE_MAX),
        description: truncate(def.defaultDescription, DESC_MAX),
      };
    }
  }

  if (!record) {
    return {
      title: SITE_NAME,
      description: "Premium Bio Sculpture nail products and professional training.",
    };
  }

  const title = truncate(record.title || record.name, TITLE_MAX);
  const description = truncate(
    record.description || "",
    DESC_MAX
  );
  const canonicalPath = record.permalink || record.path;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "";
  const canonical = baseUrl ? `${baseUrl.replace(/\/$/, "")}${canonicalPath}` : canonicalPath;

  const ogImage = record.ogImage || parseMediaJson(record.media)[0]?.src;

  return {
    title,
    description: description || undefined,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description: description || undefined,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description: description || undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export function validateSeoInput(input: {
  title?: string | null;
  description?: string | null;
  permalink?: string | null;
}) {
  const errors: string[] = [];
  if (input.title && input.title.length > TITLE_MAX) {
    errors.push(`Title must be ${TITLE_MAX} characters or fewer`);
  }
  if (input.description && input.description.length > DESC_MAX) {
    errors.push(`Meta description must be ${DESC_MAX} characters or fewer`);
  }
  if (input.permalink && !input.permalink.startsWith("/")) {
    errors.push("Permalink must start with /");
  }
  if (input.permalink && /\s/.test(input.permalink)) {
    errors.push("Permalink cannot contain spaces");
  }
  return errors;
}
