#!/usr/bin/env node
/**
 * Upgrade Product.slug values to readable name-based slugs when unique.
 * Safe to re-run. Keeps id-suffixed slugs when a clean name is already taken.
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

function slugify(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

async function main() {
  const db = new PrismaClient();
  try {
    const products = await db.product.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { createdAt: "asc" },
    });

    const used = new Set(products.map((p) => p.slug));
    let updated = 0;

    for (const product of products) {
      const base = slugify(product.name) || slugify(product.id) || "product";
      let candidate = base;
      if (used.has(candidate) && candidate !== product.slug) {
        let n = 2;
        while (used.has(`${base}-${n}`) && `${base}-${n}` !== product.slug) n++;
        candidate = used.has(`${base}-${n}`) ? `${base}-${slugify(product.id)}` : `${base}-${n}`;
      }

      if (candidate === product.slug) continue;

      used.delete(product.slug);
      used.add(candidate);
      await db.product.update({
        where: { id: product.id },
        data: { slug: candidate },
      });
      updated++;
      console.log(`  ${product.id} -> ${candidate}`);
    }

    console.log(`✅ Product slug backfill done (${updated} updated, ${products.length} total)`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
