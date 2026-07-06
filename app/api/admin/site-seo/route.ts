import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncSitePageSeoRoutes, parseMediaJson } from "@/lib/seo/sync-routes";
import { validateSeoInput } from "@/lib/seo/metadata";
import type { SitePageMediaItem } from "@/lib/seo/types";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

function serializeRecord(row: {
  id: string;
  path: string;
  name: string;
  title: string | null;
  description: string | null;
  permalink: string | null;
  ogImage: string | null;
  media: unknown;
  isDynamic: boolean;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    path: row.path,
    name: row.name,
    title: row.title,
    description: row.description,
    permalink: row.permalink,
    ogImage: row.ogImage,
    media: parseMediaJson(row.media),
    isDynamic: row.isDynamic,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  await syncSitePageSeoRoutes();

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (path) {
    const row = await db.sitePageSeo.findUnique({ where: { path } });
    if (!row) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json(serializeRecord(row));
  }

  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const rows = await db.sitePageSeo.findMany({
    orderBy: [{ path: "asc" }],
  });

  const filtered = search
    ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.path.toLowerCase().includes(search) ||
          (r.title?.toLowerCase().includes(search) ?? false)
      )
    : rows;

  return NextResponse.json({
    pages: filtered.map(serializeRecord),
    total: filtered.length,
  });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const path = body.path as string;
  if (!path) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  const errors = validateSeoInput({
    title: body.title,
    description: body.description,
    permalink: body.permalink,
  });
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(". ") }, { status: 400 });
  }

  const existing = await db.sitePageSeo.findUnique({ where: { path } });
  if (!existing) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const media = Array.isArray(body.media)
    ? (body.media as SitePageMediaItem[])
    : parseMediaJson(existing.media);

  const updated = await db.sitePageSeo.update({
    where: { path },
    data: {
      title: body.title?.trim() || null,
      description: body.description?.trim() || null,
      permalink: body.permalink?.trim() || path,
      ogImage: body.ogImage?.trim() || null,
      media,
    },
  });

  return NextResponse.json(serializeRecord(updated));
}
