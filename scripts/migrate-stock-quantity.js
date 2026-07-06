/**
 * One-time data migration: set stockQuantity from outOfStock flag.
 * outOfStock=true -> 0, outOfStock=false -> 999 (placeholder until admin sets real counts)
 */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const out = await db.product.updateMany({
    where: { outOfStock: true },
    data: { stockQuantity: 0 },
  });
  const inStock = await db.product.updateMany({
    where: { outOfStock: false },
    data: { stockQuantity: 999 },
  });
  console.log(`Updated ${out.count} out-of-stock products to 0`);
  console.log(`Updated ${inStock.count} in-stock products to 999 (placeholder)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
