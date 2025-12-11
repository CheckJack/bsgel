require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Category patterns to match in product names
// Maps category names/variations to category slugs
const categoryPatterns = [
  {
    // BIO Gel variations
    patterns: [
      /\bBIO\s+Gel\b/gi,
      /\bBio\s+Gel\b/gi,
      /\bbio\s+gel\b/gi,
      /\bBIOGEL\b/gi,
      /\bBiogel\b/gi,
      /\bbiogel\b/gi,
      /\bBIO-Gel\b/gi,
      /\bBio-Gel\b/gi,
      /\bbio-gel\b/gi,
    ],
    categorySlug: 'bio-gel',
    categoryName: 'BIO Gel',
  },
  {
    // Evo variations (including VGel which is Evo)
    patterns: [
      /\bEvo\b/gi,
      /\bEVO\b/gi,
      /\bevo\b/gi,
      /\bVGel\b/gi,
      /\bVGEL\b/gi,
      /\bvgel\b/gi,
      /\bV-Gel\b/gi,
      /\bv-gel\b/gi,
    ],
    categorySlug: 'evo',
    categoryName: 'Evo',
  },
  {
    // Gemini variations
    patterns: [
      /\bGemini\b/gi,
      /\bGEMINI\b/gi,
      /\bgemini\b/gi,
    ],
    categorySlug: 'gemini',
    categoryName: 'Gemini',
  },
  {
    // Ethos variations
    patterns: [
      /\bEthos\b/gi,
      /\bETHOS\b/gi,
      /\bethos\b/gi,
    ],
    categorySlug: 'ethos',
    categoryName: 'Ethos',
  },
  {
    // Spa variations
    patterns: [
      /\bSpa\b/gi,
      /\bSPA\b/gi,
      /\bspa\b/gi,
    ],
    categorySlug: 'spa',
    categoryName: 'Spa',
  },
];

/**
 * Extract category from product name and return cleaned name
 * Returns: { cleanedName, categorySlug, categoryName }
 */
function extractCategoryFromName(productName) {
  let cleanedName = productName;
  let foundCategory = null;
  let anyCategoryFound = false;

  // First pass: remove ALL category mentions from the name
  for (const category of categoryPatterns) {
    for (const patternStr of category.patterns) {
      // Create a new regex for each test to avoid lastIndex issues
      const pattern = new RegExp(patternStr.source, patternStr.flags);
      
      if (pattern.test(productName)) {
        anyCategoryFound = true;
        // Remove ALL instances of the matched category from the name
        cleanedName = cleanedName.replace(pattern, '').trim();
        
        // Track the first category found (for category assignment)
        if (!foundCategory) {
          foundCategory = {
            slug: category.categorySlug,
            name: category.categoryName,
          };
        }
      }
    }
  }

  // Clean up extra spaces and punctuation after removing all categories
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
  // Remove trailing/leading punctuation that might be left (pipes, dashes, etc.)
  cleanedName = cleanedName.replace(/^[,\s|-\s]+|[,\s|-\s]+$/g, '').trim();
  // Clean up multiple pipes or dashes
  cleanedName = cleanedName.replace(/\s*\|\s*\|\s*/g, ' | ').trim();
  cleanedName = cleanedName.replace(/\s*-\s*-\s*/g, ' - ').trim();
  // Remove standalone pipes or dashes
  cleanedName = cleanedName.replace(/\s*\|\s*/g, ' ').trim();
  cleanedName = cleanedName.replace(/\s*-\s*-\s*/g, ' - ').trim();

  return {
    cleanedName,
    category: foundCategory,
  };
}

/**
 * Get category ID from slug
 */
async function getCategoryIdBySlug(slug) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
    return category ? category.id : null;
  } catch (error) {
    // Fallback to raw query if schema issues
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      const result = await prisma.$queryRaw`
        SELECT id, name, slug FROM "Category" WHERE slug = ${slug} LIMIT 1
      `;
      return result[0] ? result[0].id : null;
    }
    throw error;
  }
}

async function processProducts() {
  console.log('🔍 Starting category extraction from product names...\n');

  try {
    // Fetch all products
    console.log('📦 Fetching all products...');
    let products;
    try {
      products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          categoryId: true,
        },
      });
    } catch (error) {
      // Fallback to raw query if schema issues
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('⚠️  Using raw SQL query as fallback...');
        const result = await prisma.$queryRaw`
          SELECT id, name, "categoryId" FROM "Product"
        `;
        products = result;
      } else {
        throw error;
      }
    }

    console.log(`✅ Found ${products.length} products\n`);

    // Build category cache
    console.log('📁 Building category cache...');
    const categoryCache = new Map();
    for (const category of categoryPatterns) {
      const categoryId = await getCategoryIdBySlug(category.categorySlug);
      if (categoryId) {
        categoryCache.set(category.categorySlug, categoryId);
        console.log(`   ✅ Found category: ${category.categoryName} (${category.categorySlug})`);
      } else {
        console.log(`   ⚠️  Category not found: ${category.categoryName} (${category.categorySlug})`);
      }
    }
    console.log('');

    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const updates = [];

    // Process each product
    for (const product of products) {
      const { cleanedName, category } = extractCategoryFromName(product.name);

      // Only process if we found a category and the name changed
      if (category && cleanedName !== product.name) {
        const categoryId = categoryCache.get(category.slug);
        
        if (!categoryId) {
          console.warn(`   ⚠️  Category ID not found for "${category.name}", skipping product "${product.name}"`);
          skippedCount++;
          continue;
        }

        // Check if category needs to be updated (different from current or null)
        const needsCategoryUpdate = product.categoryId !== categoryId;

        updates.push({
          id: product.id,
          name: cleanedName,
          categoryId: categoryId,
          originalName: product.name,
          originalCategoryId: product.categoryId,
          categoryName: category.name,
          needsCategoryUpdate,
        });

        processedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n📊 Analysis Summary:`);
    console.log(`   🔍 Products with category in name: ${processedCount}`);
    console.log(`   ⏭️  Products without category in name: ${skippedCount}\n`);

    if (updates.length === 0) {
      console.log('✅ No products need updating. All done!');
      return;
    }

    // Show preview of changes
    console.log('📋 Preview of changes (first 10):');
    updates.slice(0, 10).forEach((update, index) => {
      console.log(`\n   ${index + 1}. "${update.originalName}"`);
      console.log(`      → Name: "${update.name}"`);
      console.log(`      → Category: ${update.categoryName}`);
      if (update.needsCategoryUpdate) {
        console.log(`      → Category will be ${update.originalCategoryId ? 'updated' : 'set'}`);
      } else {
        console.log(`      → Category already correct`);
      }
    });

    if (updates.length > 10) {
      console.log(`\n   ... and ${updates.length - 10} more products\n`);
    }

    console.log(`\n⚠️  About to update ${updates.length} products.`);
    console.log('   This will modify product names and category assignments.\n');

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
                categoryId: update.categoryId,
              },
            });
            updatedCount++;
          } catch (error) {
            // Fallback to raw SQL if schema issues
            if (error.code === 'P2021' || error.message?.includes('does not exist')) {
              await prisma.$executeRaw`
                UPDATE "Product"
                SET name = ${update.name}, "categoryId" = ${update.categoryId}, "updatedAt" = NOW()
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

