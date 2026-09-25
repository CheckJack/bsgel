/**
 * Persist inline data:/blob: media to public/uploads/products/{id}/ and return public URLs.
 * Used on product create/update so new uploads don't reintroduce base64 into the DB.
 */
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const ROOT = path.join(process.cwd(), "public", "uploads", "products");

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
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

async function getSharp(): Promise<((input: Buffer, opts?: { failOn?: string }) => any) | null> {
  try {
    // sharp CJS default export
    const mod = await import("sharp");
    const sharpFn = (mod as any).default || mod;
    return typeof sharpFn === "function" ? sharpFn : null;
  } catch {
    return null;
  }
}

async function writeBuffer(productId: string, buffer: Buffer, mime: string, hint: string) {
  const dirName = safeDir(productId);
  const dir = path.join(ROOT, dirName);
  await fs.mkdir(dir, { recursive: true });
  const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 10);
  const isVideo = mime.startsWith("video/");
  const ext = MIME_EXT[mime] || (isVideo ? "bin" : "jpg");

  if (isVideo || mime === "image/gif") {
    const filename = `${hint}-${hash}.${ext}`;
    await fs.writeFile(path.join(dir, filename), buffer);
    return `/uploads/products/${dirName}/${filename}`;
  }

  const sharpFn = await getSharp();
  const filename = `${hint}-${hash}.webp`;
  if (sharpFn) {
    try {
      const optimized = await sharpFn(buffer, { failOn: "none" })
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      await fs.writeFile(path.join(dir, filename), optimized);
      return `/uploads/products/${dirName}/${filename}`;
    } catch {
      // fall through to original bytes
    }
  }

  const fallback = `${hint}-${hash}.${ext}`;
  await fs.writeFile(path.join(dir, fallback), buffer);
  return `/uploads/products/${dirName}/${fallback}`;
}

async function persistUrl(productId: string, url: unknown, hint: string): Promise<string | null> {
  if (url == null) return null;
  if (typeof url !== "string") return null;
  if (!url.startsWith("data:")) return url;
  const parsed = parseDataUrl(url);
  if (!parsed) return url;
  return writeBuffer(productId, parsed.buffer, parsed.mime, hint);
}

async function walk(productId: string, value: unknown, counter: { n: number }): Promise<unknown> {
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.startsWith("data:")) {
      return persistUrl(productId, value, `attr-${counter.n++}`);
    }
    return value;
  }
  if (Array.isArray(value)) {
    const out = [];
    for (const item of value) out.push(await walk(productId, item, counter));
    return out;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = await walk(productId, v, counter);
    }
    return out;
  }
  return value;
}

export async function persistProductMediaFields(opts: {
  productId: string;
  image?: string | null;
  images?: string[] | null;
  attributes?: unknown;
}): Promise<{
  image?: string | null;
  images?: string[];
  attributes?: unknown;
}> {
  const result: {
    image?: string | null;
    images?: string[];
    attributes?: unknown;
  } = {};

  if (opts.image !== undefined) {
    result.image = await persistUrl(opts.productId, opts.image, "primary");
  }

  if (opts.images !== undefined) {
    const list = Array.isArray(opts.images) ? opts.images : [];
    const next: string[] = [];
    for (let i = 0; i < list.length; i++) {
      const u = await persistUrl(opts.productId, list[i], `gallery-${i}`);
      if (u) next.push(u);
    }
    result.images = next;
  }

  if (opts.attributes !== undefined) {
    result.attributes = await walk(opts.productId, opts.attributes, { n: 0 });
  }

  return result;
}
