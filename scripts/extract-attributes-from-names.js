require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Patterns to match attributes in product names
// Matches: "12 ml", "150 ML", "1L", "25 GRS", "4.5 GR", "10g", etc.
// Handles formats with or without spaces, different cases
// Note: Attribute table uses "Size" (capital S) and values without spaces (e.g., "12ml", "14ml")
const attributePatterns = [
  // Volume patterns - Liters (L, l, liter, litres) - handles "1L", "1 L", "1 liter"
  {
    pattern: /\b(\d+(?:\.\d+)?)\s*(?:liters?|litres?|L|l)(?!\w)/gi,
    attributeKey: 'Size', // Match Attribute table format (capital S)
    unit: 'l', // Lowercase to match Attribute table format
  },
  // Volume patterns - Milliliters (ml, mL, ML, milliliters) - handles "12ml", "12 ml", "150 ML"
  {
    pattern: /\b(\d+(?:\.\d+)?)\s*(?:milliliters?|millilitres?|ml|mL|ML)(?!\w)/gi,
    attributeKey: 'Size', // Match Attribute table format (capital S)
    unit: 'ml', // No space to match Attribute table format
  },
  // Weight patterns - Grams (g, G, GR, GRS, grams) - handles "25GRS", "25 GRS", "4.5 GR", "10g"
  {
    pattern: /\b(\d+(?:\.\d+)?)\s*(?:grams?|g|G|GR|GRS)(?!\w)/gi,
    attributeKey: 'Size', // Match Attribute table format (capital S)
    unit: 'g', // No space to match Attribute table format
  },
  // Ounces (oz) - handles "8oz", "8 oz"
  {
    pattern: /\b(\d+(?:\.\d+)?)\s*(?:ounces?|oz|Oz|OZ)(?!\w)/gi,
    attributeKey: 'Size', // Match Attribute table format (capital S)
    unit: 'oz', // No space to match Attribute table format
  },
  // Fluid ounces (fl oz) - handles "8 fl oz", "8floz"
  {
    pattern: /\b(\d+(?:\.\d+)?)\s*(?:fluid\s*ounces?|fl\s*oz|floz|fl\s*oz)(?!\w)/gi,
    attributeKey: 'Size', // Match Attribute table format (capital S)
    unit: 'floz', // No space to match Attribute table format
  },
];

/**
 * Extract attributes from product name
 * Returns: { cleanedName, attributes }
 */
function extractAttributesFromName(productName) {
  let cleanedName = productName;
  const extractedAttributes = {};

  for (const { pattern, attributeKey, unit } of attributePatterns) {
    const matches = [...productName.matchAll(pattern)];
    
    if (matches.length > 0) {
      // Extract all values found
      const values = matches.map(match => {
        const numericValue = match[1];
        const value = parseFloat(numericValue);
        // Store without space to match Attribute table format (e.g., "12ml" not "12 ml")
        return `${value}${unit}`;
      });

      // Remove the matched text from the name
      cleanedName = cleanedName.replace(pattern, '').trim();
      
      // Clean up extra spaces
      cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
      
      // Remove trailing/leading punctuation that might be left
      cleanedName = cleanedName.replace(/^[,\s-]+|[,\s-]+$/g, '').trim();

      // Store the attribute
      if (!extractedAttributes[attributeKey]) {
        extractedAttributes[attributeKey] = [];
      }
      extractedAttributes[attributeKey].push(...values);
    }
  }

  // Remove duplicates from attribute arrays
  for (const key in extractedAttributes) {
    extractedAttributes[key] = [...new Set(extractedAttributes[key])];
  }

  return {
    cleanedName,
    attributes: Object.keys(extractedAttributes).length > 0 ? extractedAttributes : null,
  };
}

/**
 * Merge extracted attributes with existing attributes
 */
function mergeAttributes(existingAttributes, newAttributes) {
  if (!existingAttributes) {
    return newAttributes;
  }

  if (!newAttributes) {
    return existingAttributes;
  }

  // Parse existing attributes if it's a string
  let existing = existingAttributes;
  if (typeof existingAttributes === 'string') {
    try {
      existing = JSON.parse(existingAttributes);
    } catch (e) {
      existing = {};
    }
  }

  // Merge attributes
  const merged = { ...existing };
  
  for (const key in newAttributes) {
    if (merged[key]) {
      // Merge arrays and remove duplicates
      const combined = [...(Array.isArray(merged[key]) ? merged[key] : [merged[key]]), ...newAttributes[key]];
      merged[key] = [...new Set(combined)];
    } else {
      merged[key] = newAttributes[key];
    }
  }

  return merged;
}

async function processProducts() {
  console.log('🔍 Starting attribute extraction from product names...\n');

  try {
    // Fetch all products
    console.log('📦 Fetching all products...');
    let products;
    try {
      products = await prisma.product.findMany({
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
          SELECT id, name, attributes FROM "Product"
        `;
        products = result;
      } else {
        throw error;
      }
    }

    console.log(`✅ Found ${products.length} products\n`);

    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const updates = [];

    // Process each product
    for (const product of products) {
      const { cleanedName, attributes } = extractAttributesFromName(product.name);

      // Only process if we found attributes to extract
      if (attributes && cleanedName !== product.name) {
        const mergedAttributes = mergeAttributes(product.attributes, attributes);

        updates.push({
          id: product.id,
          name: cleanedName,
          attributes: mergedAttributes,
          originalName: product.name,
        });

        processedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n📊 Analysis Summary:`);
    console.log(`   🔍 Products with extractable attributes: ${processedCount}`);
    console.log(`   ⏭️  Products without extractable attributes: ${skippedCount}\n`);

    if (updates.length === 0) {
      console.log('✅ No products need updating. All done!');
      return;
    }

    // Show preview of changes
    console.log('📋 Preview of changes (first 10):');
    updates.slice(0, 10).forEach((update, index) => {
      console.log(`\n   ${index + 1}. "${update.originalName}"`);
      console.log(`      → "${update.name}"`);
      console.log(`      → Attributes: ${JSON.stringify(update.attributes)}`);
    });

    if (updates.length > 10) {
      console.log(`\n   ... and ${updates.length - 10} more products\n`);
    }

    // Ask for confirmation (in a real scenario, you might want to add readline)
    console.log(`\n⚠️  About to update ${updates.length} products.`);
    console.log('   This will modify product names and attributes in the database.\n');

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
                name: update.name,
                attributes: update.attributes,
              },
            });
            updatedCount++;
          } catch (error) {
            // Fallback to raw SQL if schema issues
            if (error.code === 'P2021' || error.message?.includes('does not exist')) {
              const attributesJson = JSON.stringify(update.attributes);
              await prisma.$executeRaw`
                UPDATE "Product"
                SET name = ${update.name}, attributes = ${attributesJson}::jsonb, "updatedAt" = NOW()
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
          console.error(`\n   ❌ Error updating product "${update.originalName}": ${error.message}`);
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
processProducts();

