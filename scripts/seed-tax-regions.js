const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding tax regions...");

  // Check if tax regions already exist
  const existingRegions = await prisma.taxRegion.findMany();
  if (existingRegions.length > 0) {
    console.log("Tax regions already exist. Skipping seed.");
    return;
  }

  // Create Mainland Portugal tax region
  const mainland = await prisma.taxRegion.create({
    data: {
      name: "Mainland Portugal",
      taxRate: 23.0,
      postalCodePatterns: ["1*", "2*", "3*", "4*", "5*", "6*", "7*", "8*"],
      isActive: true,
      validFrom: new Date(),
    },
  });
  console.log("Created Mainland Portugal tax region:", mainland.id);

  // Create Madeira tax region
  const madeira = await prisma.taxRegion.create({
    data: {
      name: "Madeira",
      taxRate: 22.0,
      postalCodePatterns: ["90*", "91*", "92*", "93*", "94*"],
      isActive: true,
      validFrom: new Date(),
    },
  });
  console.log("Created Madeira tax region:", madeira.id);

  // Create Azores tax region
  const azores = await prisma.taxRegion.create({
    data: {
      name: "Azores",
      taxRate: 16.0,
      postalCodePatterns: ["95*", "96*", "97*", "98*", "99*"],
      isActive: true,
      validFrom: new Date(),
    },
  });
  console.log("Created Azores tax region:", azores.id);

  console.log("Tax regions seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding tax regions:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

