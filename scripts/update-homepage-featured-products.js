/**
 * Sets homepage featured products: unfeatures training/courses/excluded items,
 * features retail nail products instead.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const UNFEATURE_IDS = [
  "PACK10TRE40",
  "PCK3TRE40",
  "FORM08",
  "FORM07",
  "FORM06",
  "FORM05",
  "FORM04",
  "FORM03",
  "FORM02",
  "FORM01",
];

const FEATURE_IDS = [
  "014CBH",
  "013CBP",
  "012CBP",
  "011CBB",
  "CGS310",
  "CGS290",
  "CGS227",
  "CGS226",
  "CGS225",
  "CGS224",
  "CGS223",
  "CGS221",
];

async function main() {
  const unfeature = await prisma.product.updateMany({
    where: { id: { in: UNFEATURE_IDS } },
    data: { featured: false },
  });

  const feature = await prisma.product.updateMany({
    where: { id: { in: FEATURE_IDS } },
    data: { featured: true },
  });

  const featured = await prisma.product.findMany({
    where: { featured: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  console.log(`Unfeatured ${unfeature.count} products`);
  console.log(`Featured ${feature.count} products`);
  console.log("Current featured:", featured.map((p) => p.name).join("\n  "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
