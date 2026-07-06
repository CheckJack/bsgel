import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RENAMES = [
  { slug: "evo", name: "Verniz Gel" },
  { slug: "ethos", name: "Cuidados das Unhas" },
  { slug: "gemini", name: "Verniz Tradicional" },
];

async function main() {
  for (const { slug, name } of RENAMES) {
    const result = await prisma.category.updateMany({
      where: { slug },
      data: { name },
    });
    console.log(`Updated ${result.count} category(ies) with slug "${slug}" -> "${name}"`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
