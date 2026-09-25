/**
 * Persist inline data:/base64 salon media to public/uploads/salons/{id}/ and return public URLs.
 * Used on salon create/update so new uploads don't reintroduce base64 into the DB.
 */
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const ROOT = path.join(process.cwd(), "public", "uploads", "salons");

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/i);
  if (!match?.[2]) return null;
  try {
    return {
      mime: (match[1] || "application/octet-stream").toLowerCase(),
      buffer: Buffer.from(match[2], "base64"),
    };
  } catch {
    return null;
  }
}

function safeDir(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function writeBuffer(salonId: string, buffer: Buffer, mime: string, hint: string) {
  const dirName = safeDir(salonId);
  const dir = path.join(ROOT, dirName);
  await fs.mkdir(dir, { recursive: true });
  const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 12);
  const ext = MIME_EXT[mime] || "jpg";
  const filename = `${hint}-${hash}.${ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);
  return `/uploads/salons/${dirName}/${filename}`;
}

async function persistUrl(salonId: string, url: unknown, hint: string): Promise<string | null> {
  if (url == null) return null;
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("data:")) return trimmed;
  const parsed = parseDataUrl(trimmed);
  if (!parsed) return trimmed;
  return writeBuffer(salonId, parsed.buffer, parsed.mime, hint);
}

export async function persistSalonMediaFields(opts: {
  salonId: string;
  image?: string | null;
  logo?: string | null;
  images?: string[] | null;
}): Promise<{
  image?: string | null;
  logo?: string | null;
  images?: string[];
}> {
  const result: {
    image?: string | null;
    logo?: string | null;
    images?: string[];
  } = {};

  if (opts.image !== undefined) {
    result.image = await persistUrl(opts.salonId, opts.image, "primary");
  }

  if (opts.logo !== undefined) {
    result.logo = await persistUrl(opts.salonId, opts.logo, "logo");
  }

  if (opts.images !== undefined) {
    const list = Array.isArray(opts.images) ? opts.images : [];
    const next: string[] = [];
    for (let i = 0; i < list.length; i++) {
      const u = await persistUrl(opts.salonId, list[i], `gallery-${i}`);
      if (u) next.push(u);
    }
    result.images = next;
  }

  return result;
}
