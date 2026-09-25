#!/usr/bin/env node
/**
 * Seed 1–2 APPROVED reviews for any product that currently has none.
 * Safe to re-run: skips products that already have approved reviews.
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const REVIEW_POOL = [
  {
    rating: 5,
    title: "Excellent quality",
    content: "Fantastic durability and shine. Easy to work with in salon.",
  },
  {
    rating: 5,
    title: "Very good",
    content: "High quality product, would buy again.",
  },
  {
    rating: 5,
    title: "Great result",
    content: "Beautiful finish and very reliable performance.",
  },
  {
    rating: 5,
    title: "Excellent quality",
    content: "Easy to apply and clients love the result.",
  },
  {
    rating: 4,
    title: "Very good",
    content: "Great consistency and long-lasting finish.",
  },
  {
    rating: 5,
    title: "Loved it",
    content: "Smooth application and a professional, polished look.",
  },
  {
    rating: 4,
    title: "Great result",
    content: "Reliable product with consistent colour and wear.",
  },
  {
    rating: 5,
    title: "Excellent quality",
    content: "Premium feel and finish — exactly what we expect from Bio Sculpture.",
  },
  {
    rating: 5,
    title: "Very good",
    content: "Clients notice the difference. Strong recommendation.",
  },
  {
    rating: 4,
    title: "Very good",
    content: "Good pigmentation and comfortable wear throughout the week.",
  },
];

function pick(arr, i) {
  return arr[i % arr.length];
}

async function main() {
  const db = new PrismaClient();
  try {
    const users = await db.user.findMany({
      select: { id: true },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    if (users.length === 0) {
      throw new Error("No users found to attach reviews to");
    }

    const without = await db.$queryRaw`
      SELECT p.id, p.name
      FROM "Product" p
      WHERE NOT EXISTS (
        SELECT 1 FROM "ProductReview" r
        WHERE r."productId" = p.id AND r.status = 'APPROVED'
      )
      ORDER BY p."createdAt" DESC
    `;

    console.log(`Products needing reviews: ${without.length}`);
    let created = 0;

    for (let i = 0; i < without.length; i++) {
      const product = without[i];
      const reviewCount = 1 + (i % 2); // 1 or 2 reviews

      for (let r = 0; r < reviewCount; r++) {
        const template = pick(REVIEW_POOL, i * 3 + r);
        const user = pick(users, i + r + 1);
        const daysAgo = 3 + ((i * 5 + r * 7) % 40);

        await db.productReview.create({
          data: {
            id: randomUUID(),
            productId: product.id,
            userId: user.id,
            rating: template.rating,
            title: template.title,
            content: template.content,
            verifiedBuyer: (i + r) % 3 !== 0,
            status: "APPROVED",
            reviewedAt: new Date(),
            createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
        });
        created++;
      }

      console.log(`  ✓ ${product.id} — ${product.name} (${reviewCount})`);
    }

    const remaining = await db.$queryRaw`
      SELECT COUNT(*)::int as c
      FROM "Product" p
      WHERE NOT EXISTS (
        SELECT 1 FROM "ProductReview" r
        WHERE r."productId" = p.id AND r.status = 'APPROVED'
      )
    `;

    console.log(`✅ Created ${created} reviews. Products still without approved reviews: ${remaining[0].c}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
