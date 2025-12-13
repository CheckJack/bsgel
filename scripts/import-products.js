require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Command line arguments
const args = process.argv.slice(2);
const importFile = args[0] || 'products-export-latest.json';
const skipExisting = args.includes('--skip-existing') || args.includes('-s');
const updateExisting = args.includes('--update-existing') || args.includes('-u');

async function importProducts() {
  console.log('📦 Starting product import...\n');
  
  // Determine file path
  let filepath;
  if (path.isAbsolute(importFile)) {
    filepath = importFile;
  } else {
    // Try exports directory first
    const exportsPath = path.join(__dirname, '../exports', importFile);
    if (fs.existsSync(exportsPath)) {
      filepath = exportsPath;
    } else {
      // Try current directory
      filepath = path.join(process.cwd(), importFile);
    }
  }
  
  if (!fs.existsSync(filepath)) {
    console.error(`❌ Import file not found: ${filepath}`);
    console.error('\n💡 Usage:');
    console.error('   node scripts/import-products.js [filename] [options]');
    console.error('\n   Options:');
    console.error('   --skip-existing, -s    Skip products that already exist');
    console.error('   --update-existing, -u   Update products that already exist');
    console.error('\n   Examples:');
    console.error('   node scripts/import-products.js');
    console.error('   node scripts/import-products.js products-export-2025-01-15.json');
    console.error('   node scripts/import-products.js products-export-latest.json --update-existing');
    process.exit(1);
  }
  
  try {
    console.log(`📖 Reading import file: ${filepath}`);
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const exportData = JSON.parse(fileContent);
    
    if (!exportData.products || !Array.isArray(exportData.products)) {
      console.error('❌ Invalid export file format. Expected "products" array.');
      process.exit(1);
    }
    
    console.log(`📄 Found ${exportData.products.length} products to import`);
    if (exportData.categories) {
      console.log(`📁 Found ${exportData.categories.length} categories to import\n`);
    }
    
    // First, import categories
    const categoryIdMap = new Map(); // Maps old category ID to new category ID
    let categoriesCreated = 0;
    let categoriesSkipped = 0;
    
    if (exportData.categories && exportData.categories.length > 0) {
      console.log('📁 Importing categories...');
      
      for (const categoryData of exportData.categories) {
        try {
          // Check if category exists by slug
          const existing = await prisma.category.findUnique({
            where: { slug: categoryData.slug },
            select: { id: true },
          });
          
          if (existing) {
            categoryIdMap.set(categoryData.id, existing.id);
            categoriesSkipped++;
            process.stdout.write(`   ⏭️  Category "${categoryData.name}" already exists\r`);
          } else {
            // Create category
            // Handle parent category mapping if needed
            let parentId = null;
            if (categoryData.parentId) {
              parentId = categoryIdMap.get(categoryData.parentId) || null;
            }
            
            const newCategory = await prisma.category.create({
              data: {
                name: categoryData.name,
                slug: categoryData.slug,
                description: categoryData.description,
                image: categoryData.image,
                icon: categoryData.icon,
                parentId: parentId,
              },
            });
            
            categoryIdMap.set(categoryData.id, newCategory.id);
            categoriesCreated++;
            console.log(`   ✅ Created category: ${categoryData.name}`);
          }
        } catch (error) {
          console.error(`\n   ❌ Error importing category "${categoryData.name}": ${error.message}`);
        }
      }
      
      console.log(`\n📁 Categories: ${categoriesCreated} created, ${categoriesSkipped} skipped\n`);
    }
    
    // Now import products
    let productsCreated = 0;
    let productsUpdated = 0;
    let productsSkipped = 0;
    let productsErrored = 0;
    
    console.log('📦 Importing products...\n');
    
    // Process in batches
    const batchSize = 50;
    const totalBatches = Math.ceil(exportData.products.length / batchSize);
    
    for (let i = 0; i < exportData.products.length; i += batchSize) {
      const batch = exportData.products.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} products)...`);
      
      for (const productData of batch) {
        try {
          // Check if product exists
          const existing = await prisma.product.findUnique({
            where: { id: productData.id },
            select: { id: true, name: true },
          });
          
          if (existing) {
            if (skipExisting) {
              productsSkipped++;
              process.stdout.write(`   ⏭️  Skipping "${productData.name}" (already exists)\r`);
              continue;
            } else if (updateExisting) {
              // Update existing product
              // Map category ID if needed
              let categoryId = productData.categoryId;
              if (categoryId && categoryIdMap.has(categoryId)) {
                categoryId = categoryIdMap.get(categoryId);
              } else if (categoryId && !categoryIdMap.has(categoryId)) {
                // Category doesn't exist in new DB, set to null
                categoryId = null;
              }
              
              await prisma.product.update({
                where: { id: productData.id },
                data: {
                  name: productData.name,
                  description: productData.description,
                  price: productData.price,
                  salePrice: productData.salePrice,
                  discountPercentage: productData.discountPercentage,
                  image: productData.image,
                  images: productData.images,
                  featured: productData.featured,
                  categoryId: categoryId,
                  attributes: productData.attributes,
                  showcasingSections: productData.showcasingSections,
                },
              });
              
              productsUpdated++;
              process.stdout.write(`   ✏️  Updated "${productData.name}"\r`);
            } else {
              // Default: skip existing
              productsSkipped++;
              process.stdout.write(`   ⏭️  Skipping "${productData.name}" (already exists, use --update-existing to update)\r`);
              continue;
            }
          } else {
            // Create new product
            // Map category ID if needed
            let categoryId = productData.categoryId;
            if (categoryId && categoryIdMap.has(categoryId)) {
              categoryId = categoryIdMap.get(categoryId);
            } else if (categoryId && !categoryIdMap.has(categoryId)) {
              // Category doesn't exist in new DB, set to null
              categoryId = null;
            }
            
            await prisma.product.create({
              data: {
                id: productData.id, // Keep original ID
                name: productData.name,
                description: productData.description,
                price: productData.price,
                salePrice: productData.salePrice,
                discountPercentage: productData.discountPercentage,
                image: productData.image,
                images: productData.images,
                featured: productData.featured,
                categoryId: categoryId,
                attributes: productData.attributes,
                showcasingSections: productData.showcasingSections,
              },
            });
            
            productsCreated++;
            process.stdout.write(`   ✅ Created "${productData.name}"\r`);
          }
          
          // Import subcategories
          if (productData.subcategories && productData.subcategories.length > 0) {
            for (const subcatData of productData.subcategories) {
              try {
                // Map category ID
                let mappedCategoryId = subcatData.categoryId;
                if (categoryIdMap.has(mappedCategoryId)) {
                  mappedCategoryId = categoryIdMap.get(mappedCategoryId);
                } else {
                  // Skip if category doesn't exist
                  continue;
                }
                
                // Check if subcategory relationship already exists
                const existingSubcat = await prisma.productSubcategory.findUnique({
                  where: {
                    productId_categoryId: {
                      productId: productData.id,
                      categoryId: mappedCategoryId,
                    },
                  },
                });
                
                if (!existingSubcat) {
                  await prisma.productSubcategory.create({
                    data: {
                      productId: productData.id,
                      categoryId: mappedCategoryId,
                    },
                  });
                }
              } catch (error) {
                // Ignore duplicate subcategory errors
                if (!error.message.includes('Unique constraint')) {
                  console.error(`\n   ⚠️  Error creating subcategory: ${error.message}`);
                }
              }
            }
          }
          
        } catch (error) {
          productsErrored++;
          console.error(`\n   ❌ Error processing "${productData.name}": ${error.message}`);
          if (error.message.includes('Unique constraint')) {
            productsSkipped++;
            productsErrored--; // Don't count duplicates as errors
          }
        }
      }
      
      console.log(''); // New line after batch
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Products created: ${productsCreated}`);
    if (updateExisting) {
      console.log(`   ✏️  Products updated: ${productsUpdated}`);
    }
    console.log(`   ⏭️  Products skipped: ${productsSkipped}`);
    if (productsErrored > 0) {
      console.log(`   ❌ Products with errors: ${productsErrored}`);
    }
    console.log(`\n✅ Import completed!`);
    
    // Show total products in database
    const totalProducts = await prisma.product.count();
    console.log(`\n📦 Total products in database: ${totalProducts}`);
    
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importProducts();

