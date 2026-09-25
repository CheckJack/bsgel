/**
 * Migrate salon data: / base64 media into public/uploads/salons/{id}/
 * Updates only image / logo / images URLs.
 * Does NOT delete salons or change name, address, status, etc.
 *
 * Writes the original decoded bytes (no recompress) so nothing stored in DB is lost.
 * Identical base64 values within a salon reuse one file via cache.
 *
 * Usage: node scripts/migrate-salon-images.mjs [--dry-run] [--limit=N]
 */
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ROOT = path.join(process.cwd(), "public", "uploads", "salons");
const BACKUP_DIR = path.join(process.cwd(), "database-backups", "salon-image-migration");
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
};

function parseDataUrl(dataUrl) {
  const match = String(dataUrl).match(
    /^data:([^;,]+)?(?:;charset=[^;,]+)?(?:;base64)?,([\s\S]*)$/i
  );
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

/** Accept plain base64 blobs that some older salon rows may store without a data: prefix. */
function parseMaybePlainBase64(value) {
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("data:")) return parseDataUrl(value);
  if (value.startsWith("/") || value.startsWith("http")) return null;
  if (value.length < 200) return null;
  if (!/^[A-Za-z0-9+/=\s]+$/.test(value.slice(0, 200))) return null;
  try {
    const buffer = Buffer.from(value.replace(/\s/g, ""), "base64");
    if (buffer.length < 32) return null;
    // sniff mime from magic bytes
    let mime = "image/jpeg";
    if (buffer[0] === 0x89 && buffer[1] === 0x50) mime = "image/png";
    else if (buffer[0] === 0x47 && buffer[1] === 0x49) mime = "image/gif";
    else if (buffer[0] === 0x52 && buffer[1] === 0x49) mime = "image/webp";
    return { mime, buffer };
  } catch {
    return null;
  }
}

function needsMigration(value) {
  if (!value || typeof value !== "string") return false;
  if (value.startsWith("data:")) return true;
  return Boolean(parseMaybePlainBase64(value));
}

function safeSalonDir(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeMedia(salonId, buffer, mime, indexHint) {
  const ext = MIME_EXT[mime] || "bin";
  const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 12);
  const dirName = safeSalonDir(salonId);
  const dir = path.join(ROOT, dirName);
  await ensureDir(dir);

  const filename = `${indexHint}-${hash}.${ext}`;
  const abs = path.join(dir, filename);
  if (!DRY) {
    // Skip rewrite if identical file already exists
    try {
      const existing = await fs.readFile(abs);
      if (existing.equals(buffer)) {
        return `/uploads/salons/${dirName}/${filename}`;
      }
    } catch {
      // not present
    }
    await fs.writeFile(abs, buffer);
  }
  return `/uploads/salons/${dirName}/${filename}`;
}

async function migrateValue(salonId, url, indexHint, cache) {
  if (!url || typeof url !== "string") return url;
  if (!needsMigration(url)) return url;
  if (cache.has(url)) return cache.get(url);

  const parsed = parseMaybePlainBase64(url);
  if (!parsed) {
    console.warn(`  skip invalid media ${salonId}#${indexHint}`);
    return url;
  }

  const publicUrl = await writeMedia(salonId, parsed.buffer, parsed.mime, indexHint);
  cache.set(url, publicUrl);
  return publicUrl;
}

async function main() {
  await ensureDir(ROOT);
  if (!DRY) await ensureDir(BACKUP_DIR);

  const salons = await prisma.salon.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      logo: true,
      images: true,
      address: true,
      city: true,
      status: true,
      updatedAt: true,
    },
    orderBy: { id: "asc" },
    ...(LIMIT > 0 ? { take: LIMIT } : {}),
  });

  console.log(`Migrating up to ${salons.length} salons (dryRun=${DRY})…`);

  const backupManifest = [];
  let updated = 0;
  let skipped = 0;
  let mediaWritten = 0;
  let fieldsMigrated = 0;

  for (const salon of salons) {
    const cache = new Map();
    let changed = false;
    const before = {
      id: salon.id,
      name: salon.name,
      imageLen: salon.image?.length || 0,
      logoLen: salon.logo?.length || 0,
      imagesCount: Array.isArray(salon.images) ? salon.images.length : 0,
      imageSha: salon.image
        ? crypto.createHash("sha1").update(salon.image).digest("hex").slice(0, 12)
        : null,
      logoSha: salon.logo
        ? crypto.createHash("sha1").update(salon.logo).digest("hex").slice(0, 12)
        : null,
      imagesShas: (salon.images || []).map((img) =>
        typeof img === "string"
          ? crypto.createHash("sha1").update(img).digest("hex").slice(0, 12)
          : null
      ),
    };

    let image = salon.image;
    if (needsMigration(image)) {
      image = await migrateValue(salon.id, image, "primary", cache);
      mediaWritten++;
      fieldsMigrated++;
      changed = true;
    }

    let logo = salon.logo;
    if (needsMigration(logo)) {
      logo = await migrateValue(salon.id, logo, "logo", cache);
      mediaWritten++;
      fieldsMigrated++;
      changed = true;
    }

    const images = Array.isArray(salon.images) ? [...salon.images] : [];
    for (let i = 0; i < images.length; i++) {
      if (needsMigration(images[i])) {
        images[i] = await migrateValue(salon.id, images[i], `gallery-${i}`, cache);
        mediaWritten++;
        fieldsMigrated++;
        changed = true;
      }
    }

    if (!changed) {
      skipped++;
      continue;
    }

    backupManifest.push({
      ...before,
      after: { image, logo, images },
    });

    if (!DRY) {
      await prisma.salon.update({
        where: { id: salon.id },
        data: { image, logo, images },
      });
    }

    updated++;
    console.log(`  ✓ ${salon.name} (${salon.id}) → image/logo/gallery migrated`);
  }

  if (!DRY && backupManifest.length) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(BACKUP_DIR, `manifest-${stamp}.json`);
    await fs.writeFile(
      backupPath,
      JSON.stringify(
        {
          migratedAt: new Date().toISOString(),
          salons: backupManifest,
        },
        null,
        2
      )
    );
    console.log(`Backup manifest: ${backupPath}`);
  }

  const remaining = await prisma.$queryRaw`
    SELECT COUNT(*)::int as c FROM "Salon"
    WHERE image LIKE 'data:%'
       OR logo LIKE 'data:%'
       OR EXISTS (SELECT 1 FROM unnest(images) x WHERE x LIKE 'data:%')
  `;

  // Verify every migrated URL points to an existing file (when not dry-run)
  let missingFiles = 0;
  if (!DRY) {
    const after = await prisma.salon.findMany({
      select: { id: true, image: true, logo: true, images: true },
    });
    for (const s of after) {
      for (const url of [s.image, s.logo, ...(s.images || [])]) {
        if (!url || typeof url !== "string") continue;
        if (!url.startsWith("/uploads/salons/")) continue;
        const abs = path.join(process.cwd(), "public", url);
        try {
          await fs.access(abs);
        } catch {
          missingFiles++;
          console.error(`Missing file for salon ${s.id}: ${url}`);
        }
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun: DRY,
        salonsScanned: salons.length,
        salonsUpdated: updated,
        salonsSkipped: skipped,
        fieldsMigrated,
        mediaWriteCalls: mediaWritten,
        remainingDataImageSalons: remaining[0]?.c,
        missingFiles,
      },
      null,
      2
    )
  );

  if (!DRY && (remaining[0]?.c > 0 || missingFiles > 0)) {
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
