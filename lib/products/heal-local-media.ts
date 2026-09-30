/**
 * If a product still points at dead WordPress URLs but local uploads exist on disk,
 * prefer those local files. Never invent media; never touch non-media fields.
 *
 * Important: when the payload already includes /uploads/ URLs, keep that list
 * (drop dead WP only). Do NOT merge the entire on-disk folder into the gallery —
 * that caused confusing mixes and made new uploads look like they "vanished".
 */
import fs from "fs/promises";
import path from "path";

const ROOT = path.join(process.cwd(), "public", "uploads", "products");

export function safeProductUploadDir(id: string) {
  const cleaned = String(id || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "unknown";
}

function isDeadWpUrl(url: string) {
  return /\/wp-content\//i.test(url);
}

function isLocalUploadUrl(url: string) {
  return url.startsWith("/uploads/");
}

export async function listLocalProductMediaUrls(productId: string): Promise<string[]> {
  const dirName = safeProductUploadDir(productId);
  const dir = path.join(ROOT, dirName);
  try {
    const names = await fs.readdir(dir);
    return names
      .filter((n) => /\.(webp|jpe?g|png|gif|mp4|webm)$/i.test(n))
      .sort()
      .map((n) => `/uploads/products/${dirName}/${n}`);
  } catch {
    return [];
  }
}

function dedupe(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter((u) => {
    if (!u || seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

export async function preferLocalProductMedia(opts: {
  productId: string;
  image?: string | null;
  images?: string[] | null;
}): Promise<{ image: string | null; images: string[] }> {
  const incoming = dedupe(
    [opts.image, ...(opts.images ?? [])].filter(
      (u): u is string =>
        typeof u === "string" && u.length > 0 && !u.startsWith("blob:")
    )
  );

  const onlyDeadWp =
    incoming.length > 0 && incoming.every((u) => isDeadWpUrl(u));

  // Empty or exclusively dead WP — try local files already on disk.
  if (incoming.length === 0 || onlyDeadWp) {
    const diskLocals = await listLocalProductMediaUrls(opts.productId);
    if (diskLocals.length > 0) {
      return { image: diskLocals[0] ?? null, images: diskLocals.slice(1) };
    }
  }

  // Keep the payload as the admin sent it (including mixed local + legacy WP).
  return { image: incoming[0] ?? null, images: incoming.slice(1) };
}
