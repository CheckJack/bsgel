require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Convert attribute format to match Attribute table
 * - "size" -> "Size" (capital S)
 * - "12 ml" -> "12ml" (remove space)
 * - "14 ml" -> "14ml" (remove space)
 * - "25 g" -> "25g" (remove space)
 * - "4.5 g" -> "4.5g" (remove space)
 */
function fixAttributeFormat(attributes) {
  if (!attributes || typeof attributes !== 'object') {
    return null;
  }

  // Parse if it's a string
  let attrs = attributes;
  if (typeof attributes === 'string') {
    try {
      attrs = JSON.parse(attributes);
    } catch (e) {
      return null;
    }
  }

  const fixed = {};

  for (const key in attrs) {
    // Convert "size" to "Size"
    const newKey = key === 'size' ? 'Size' : key;
    
    const values = Array.isArray(attrs[key]) ? attrs[key] : [attrs[key]];
    const fixedValues = values.map(value => {
      if (typeof value !== 'string') {
        return String(value);
      }
      // Remove spaces between number and unit (e.g., "12 ml" -> "12ml")
      // Match patterns like "12 ml", "14 ml", "25 g", "4.5 g", etc.
      return value.replace(/(\d+(?:\.\d+)?)\s+(ml|mL|ML|g|G|l|L|oz|Oz|OZ|fl\s*oz|floz)/gi, '$1$2');
    });

    fixed[newKey] = fixedValues;
  }

  return Object.keys(fixed).length > 0 ? fixed : null;
}

async function fixProductAttributes() {
  console.log('🔧 Starting attribute format fix...\n');

  try {
    // Fetch all products with attributes
    console.log('📦 Fetching products with attributes...');
    let products;
    try {
      products = await prisma.product.findMany({
        where: {
          attributes: {
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          attributes: true,
        },
      });
    } catch (error) {
      // Fallback to raw query if schema issues
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('⚠️  Using raw SQL query as fallback...');
        const result = await prisma.$queryRaw`
          SELECT id, name, attributes FROM "Product" WHERE attributes IS NOT NULL
        `;
        products = result;
      } else {
        throw error;
      }
    }

    console.log(`✅ Found ${products.length} products with attributes\n`);

    if (products.length === 0) {
      console.log('✅ No products to fix. All done!');
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const updates = [];

    // Process each product
    for (const product of products) {
      const fixedAttributes = fixAttributeFormat(product.attributes);
      
      // Check if format needs fixing
      const needsFix = JSON.stringify(product.attributes) !== JSON.stringify(fixedAttributes);
      
      if (needsFix && fixedAttributes) {
        updates.push({
          id: product.id,
          name: product.name,
          originalAttributes: product.attributes,
          fixedAttributes: fixedAttributes,
        });
      } else {
        skippedCount++;
      }
    }

    console.log(`\n📊 Analysis Summary:`);
    console.log(`   🔧 Products needing format fix: ${updates.length}`);
    console.log(`   ⏭️  Products already in correct format: ${skippedCount}\n`);

    if (updates.length === 0) {
      console.log('✅ No products need fixing. All done!');
      return;
    }

    // Show preview of changes
    console.log('📋 Preview of changes (first 10):');
    updates.slice(0, 10).forEach((update, index) => {
      console.log(`\n   ${index + 1}. "${update.name}"`);
      console.log(`      Before: ${JSON.stringify(update.originalAttributes)}`);
      console.log(`      After:  ${JSON.stringify(update.fixedAttributes)}`);
    });

    if (updates.length > 10) {
      console.log(`\n   ... and ${updates.length - 10} more products\n`);
    }

    console.log(`\n⚠️  About to update ${updates.length} products.`);
    console.log('   This will fix the attribute format to match the Attribute table.\n');

    // Process updates in batches
    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(updates.length / batchSize);

      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} products)...`);

      for (const update of batch) {
        try {
          // Try Prisma update first
          try {
            await prisma.product.update({
              where: { id: update.id },
              data: {
                attributes: update.fixedAttributes,
              },
            });
            updatedCount++;
          } catch (error) {
            // Fallback to raw SQL if schema issues
            if (error.code === 'P2021' || error.message?.includes('does not exist')) {
              const attributesJson = JSON.stringify(update.fixedAttributes);
              await prisma.$executeRaw`
                UPDATE "Product"
                SET attributes = ${attributesJson}::jsonb, "updatedAt" = NOW()
                WHERE id = ${update.id}
              `;
              updatedCount++;
            } else {
              throw error;
            }
          }

          if (updatedCount % 10 === 0) {
            process.stdout.write(`   ✅ Updated ${updatedCount}/${updates.length} products...\r`);
          }
        } catch (error) {
          console.error(`\n   ❌ Error updating product "${update.name}": ${error.message}`);
        }
      }
    }

    console.log(`\n\n✅ Update Summary:`);
    console.log(`   ✅ Successfully updated: ${updatedCount} products`);
    console.log(`   ⏭️  Skipped: ${skippedCount} products`);
    console.log(`\n✅ Process completed!`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixProductAttributes();

