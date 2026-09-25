/**
 * Migrate product data: / base64 media into public/uploads/products/{id}/
 * Updates only image / images / attributes media URLs.
 * Does NOT delete products or change name, price, stock, etc.
 *
 * Usage: node scripts/migrate-product-images.mjs [--dry-run] [--limit=N]
 */
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { createRequire } from "module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const prisma = new PrismaClient();
const ROOT = path.join(process.cwd(), "public", "uploads", "products");
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : 0;

const MIME_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogg",
  "video/quicktime": "mov",
};

function parseDataUrl(dataUrl) {
  const match = String(dataUrl).match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(?:;base64)?,([\s\S]*)$/i);
  if (!match) return null;
  const mime = (match[1] || "application/octet-stream").toLowerCase();
  const payload = match[2];
  const isBase64 = /;base64/i.test(String(dataUrl).slice(0, 128));
  try {
    const buffer = isBase64
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload), "utf8");
    if (!buffer.length) return null;
    return { mime, buffer };
  } catch {
    return null;
  }
}

function safeProductDir(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeMedia(productId, buffer, mime, indexHint) {
  const ext = MIME_EXT[mime] || (mime.startsWith("video/") ? "bin" : "jpg");
  const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 10);
  const dirName = safeProductDir(productId);
  const dir = path.join(ROOT, dirName);
  await ensureDir(dir);

  const isVideo = mime.startsWith("video/");
  const base = `${indexHint}-${hash}`;

  if (isVideo || mime === "image/svg+xml" || mime === "image/gif") {
    const filename = `${base}.${ext}`;
    const abs = path.join(dir, filename);
    if (!DRY) await fs.writeFile(abs, buffer);
    return `/uploads/products/${dirName}/${filename}`;
  }

  // Raster images: write optimized web-friendly JPEG/WebP (same photo, smaller)
  const filename = `${base}.webp`;
  const abs = path.join(dir, filename);
  if (!DRY) {
    try {
      const optimized = await sharp(buffer, { failOn: "none" })
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      await fs.writeFile(abs, optimized);
    } catch (err) {
      // Fallback: write original bytes
      const fallback = `${base}.${ext}`;
      const fallbackAbs = path.join(dir, fallback);
      await fs.writeFile(fallbackAbs, buffer);
      console.warn(`  sharp failed for ${productId}#${indexHint}, wrote original:`, err.message);
      return `/uploads/products/${dirName}/${fallback}`;
    }
  }
  return `/uploads/products/${dirName}/${filename}`;
}

async function migrateUrl(productId, url, indexHint, cache) {
  if (!url || typeof url !== "string") return url;
  if (!url.startsWith("data:")) return url;
  if (cache.has(url)) return cache.get(url);

  const parsed = parseDataUrl(url);
  if (!parsed) {
    console.warn(`  skip invalid data URL ${productId}#${indexHint}`);
    return url;
  }

  const publicUrl = await writeMedia(productId, parsed.buffer, parsed.mime, indexHint);
  cache.set(url, publicUrl);
  return publicUrl;
}

async function walkAttributes(productId, value, counter, cache) {
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.startsWith("data:")) {
      const idx = counter.n++;
      return migrateUrl(productId, value, `attr-${idx}`, cache);
    }
    return value;
  }
  if (Array.isArray(value)) {
    const out = [];
    for (const item of value) {
      out.push(await walkAttributes(productId, item, counter, cache));
    }
    return out;
  }
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = await walkAttributes(productId, v, counter, cache);
    }
    return out;
  }
  return value;
}

async function main() {
  await ensureDir(ROOT);

  const products = await prisma.product.findMany({
    select: { id: true, image: true, images: true, attributes: true },
    orderBy: { id: "asc" },
    ...(LIMIT > 0 ? { take: LIMIT } : {}),
  });

  console.log(`Migrating up to ${products.length} products (dryRun=${DRY})…`);

  let updated = 0;
  let skipped = 0;
  let mediaWritten = 0;

  for (const product of products) {
    const cache = new Map();
    let changed = false;

    let image = product.image;
    if (image?.startsWith("data:")) {
      image = await migrateUrl(product.id, image, "primary", cache);
      mediaWritten++;
      changed = true;
    }

    const images = Array.isArray(product.images) ? [...product.images] : [];
    for (let i = 0; i < images.length; i++) {
      if (typeof images[i] === "string" && images[i].startsWith("data:")) {
        images[i] = await migrateUrl(product.id, images[i], `gallery-${i}`, cache);
        mediaWritten++;
        changed = true;
      }
    }

    let attributes = product.attributes;
    if (attributes && JSON.stringify(attributes).includes("data:")) {
      const next = await walkAttributes(product.id, attributes, { n: 0 }, cache);
      attributes = next;
      changed = true;
    }

    if (!changed) {
      skipped++;
      continue;
    }

    if (!DRY) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          image,
          images,
          ...(attributes !== product.attributes ? { attributes } : {}),
        },
      });
    }

    updated++;
    if (updated % 25 === 0) {
      console.log(`  … ${updated} updated, ${skipped} skipped`);
    }
  }

  // Verify counts
  const remaining = await prisma.$queryRaw`
    SELECT COUNT(*)::int as c FROM "Product"
    WHERE image LIKE 'data:%'
       OR EXISTS (SELECT 1 FROM unnest(images) x WHERE x LIKE 'data:%')
  `;

  console.log(
    JSON.stringify(
      {
        dryRun: DRY,
        productsScanned: products.length,
        productsUpdated: updated,
        productsSkipped: skipped,
        mediaWrittenApprox: mediaWritten,
        remainingDataImageProducts: remaining[0]?.c,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
