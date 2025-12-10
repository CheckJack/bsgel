require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Function to parse CSV with proper handling of multi-line quoted fields
function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote (double quote)
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (char === '\n' && !inQuotes) {
      // End of row (only if not in quotes)
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // Add last field and row
  if (currentField.trim() || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      rows.push(currentRow);
    }
  }
  
  return rows;
}

// Function to convert Portuguese number format (comma as decimal) to standard format
function parsePortuguesePrice(priceStr) {
  if (!priceStr || priceStr.trim() === '') {
    return null;
  }
  
  // Remove any whitespace and convert comma to dot
  const cleaned = priceStr.trim().replace(',', '.');
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) {
    return null;
  }
  
  return parsed;
}

// Function to parse image URLs (can be multiple URLs separated by commas)
function parseImages(imageStr) {
  if (!imageStr || imageStr.trim() === '') {
    return [];
  }
  
  // Split by comma and clean up URLs
  return imageStr
    .split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));
}

// Function to clean description (remove HTML tags, iframes, etc.)
function cleanDescription(desc) {
  if (!desc || desc.trim() === '') {
    return null;
  }
  
  // Remove iframe tags and their content
  let cleaned = desc.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
  
  // Remove other HTML tags but keep text content
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // Clean up extra whitespace and newlines
  cleaned = cleaned.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Limit description length to 1000 characters (adjust as needed)
  if (cleaned.length > 1000) {
    cleaned = cleaned.substring(0, 997) + '...';
  }
  
  return cleaned || null;
}

// Function to determine category based on product name
function determineCategory(name) {
  const nameLower = name.toLowerCase();
  
  // Check for category keywords in product name
  if (nameLower.includes('bio gel') || nameLower.includes('biogel') || nameLower.includes('bio-gel')) {
    return 'bio-gel';
  }
  if (nameLower.includes('ethos')) {
    return 'ethos';
  }
  if (nameLower.includes('evo') || nameLower.includes('vgel')) {
    return 'evo';
  }
  if (nameLower.includes('gemini')) {
    return 'gemini';
  }
  if (nameLower.includes('spa')) {
    return 'spa';
  }
  
  return null;
}

// Function to get or create category
async function getOrCreateCategory(prisma, categorySlug) {
  if (!categorySlug) {
    return null;
  }
  
  // Map slugs to proper category names
  const categoryMap = {
    'bio-gel': { name: 'BIO Gel', slug: 'bio-gel' },
    'ethos': { name: 'Ethos', slug: 'ethos' },
    'evo': { name: 'Evo', slug: 'evo' },
    'gemini': { name: 'Gemini', slug: 'gemini' },
    'spa': { name: 'Spa', slug: 'spa' },
  };
  
  const categoryInfo = categoryMap[categorySlug];
  if (!categoryInfo) {
    return null;
  }
  
  // Try to find existing category - only select fields that exist
  let category;
  try {
    category = await prisma.category.findUnique({
      where: { slug: categoryInfo.slug },
      select: { id: true, name: true, slug: true },
    });
  } catch (error) {
    // If schema doesn't match, try without select
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      // Use raw query as fallback
      const result = await prisma.$queryRaw`
        SELECT id, name, slug FROM "Category" WHERE slug = ${categoryInfo.slug} LIMIT 1
      `;
      category = result[0] || null;
    } else {
      throw error;
    }
  }
  
  // Create category if it doesn't exist
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: categoryInfo.name,
        slug: categoryInfo.slug,
        description: `${categoryInfo.name} products`,
      },
    });
    console.log(`   📁 Created category: ${categoryInfo.name}`);
  }
  
  return category.id;
}

async function importProducts() {
  console.log('📦 Starting product import from CSV...\n');
  
  const csvPath = path.join(__dirname, '../public/wc-product-export-3-12-2025-1764788461655.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at: ${csvPath}`);
    process.exit(1);
  }
  
  try {
    // Read the CSV file
    console.log('📖 Reading CSV file...');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV with proper multi-line handling
    console.log('🔍 Parsing CSV content...');
    const rows = parseCSV(csvContent);
    
    // Skip header row
    const dataRows = rows.slice(1).filter(row => row.length >= 4 && row[0]?.trim());
    
    console.log(`📄 Found ${dataRows.length} products to import\n`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process products in batches to avoid overwhelming the database
    const batchSize = 50;
    
    for (let i = 0; i < dataRows.length; i += batchSize) {
      const batch = dataRows.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(dataRows.length / batchSize);
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} products)...`);
      
      for (const row of batch) {
        try {
          if (row.length < 4) {
            console.warn(`⚠️  Skipping row with insufficient fields: ${row[0] || 'Unknown'}`);
            skippedCount++;
            continue;
          }
          
          const name = row[0]?.trim() || '';
          const description = cleanDescription(row[1]);
          const priceStr = row[2]?.trim() || '';
          const imagesStr = row[3]?.trim() || '';
          
          // Skip if no name
          if (!name) {
            console.warn(`⚠️  Skipping product with no name`);
            skippedCount++;
            continue;
          }
          
          // Parse price
          const price = parsePortuguesePrice(priceStr);
          if (price === null || price <= 0) {
            console.warn(`⚠️  Skipping "${name}" - invalid price: ${priceStr}`);
            skippedCount++;
            continue;
          }
          
          // Parse images
          const imageUrls = parseImages(imagesStr);
          const primaryImage = imageUrls[0] || null;
          const additionalImages = imageUrls.slice(1);
          
          // Determine category based on product name
          const categorySlug = determineCategory(name);
          const categoryId = await getOrCreateCategory(prisma, categorySlug);
          
          // Check if product already exists (by name) - only select fields that exist
          let existing;
          try {
            existing = await prisma.product.findFirst({
              where: {
                name: name,
              },
              select: { id: true, name: true },
            });
          } catch (error) {
            // If schema doesn't match, use raw query
            if (error.code === 'P2021' || error.message?.includes('salePrice') || error.message?.includes('does not exist')) {
              const result = await prisma.$queryRaw`
                SELECT id, name FROM "Product" WHERE name = ${name} LIMIT 1
              `;
              existing = result[0] || null;
            } else {
              throw error;
            }
          }
          
          if (existing) {
            console.log(`⏭️  Skipping "${name}" - already exists`);
            skippedCount++;
            continue;
          }
          
          // Create product - handle schema mismatches
          try {
            await prisma.product.create({
              data: {
                name: name.substring(0, 255), // Ensure name doesn't exceed DB limits
                description: description,
                price: price,
                image: primaryImage,
                images: additionalImages,
                featured: false,
                categoryId: categoryId,
              },
            });
          } catch (error) {
            // If schema doesn't match (missing salePrice or other fields), use raw SQL
            if (error.code === 'P2021' || error.message?.includes('salePrice') || error.message?.includes('does not exist')) {
              // Use raw SQL to insert only fields that exist
              const imageArray = additionalImages.length > 0 ? `{${additionalImages.map(img => `"${img.replace(/"/g, '\\"')}"`).join(',')}}` : '{}';
              await prisma.$executeRaw`
                INSERT INTO "Product" (id, name, description, price, image, images, featured, "categoryId", "createdAt", "updatedAt")
                VALUES (gen_random_uuid()::text, ${name.substring(0, 255)}, ${description}, ${price}, ${primaryImage}, ${imageArray}::text[], false, ${categoryId}, NOW(), NOW())
              `;
            } else {
              throw error;
            }
          }
          
          successCount++;
          
          if (successCount % 10 === 0) {
            process.stdout.write(`✅ Imported ${successCount} products...\r`);
          }
          
        } catch (error) {
          errorCount++;
          console.error(`\n❌ Error processing product "${row[0] || 'Unknown'}": ${error.message}`);
          if (error.message.includes('Unique constraint')) {
            skippedCount++;
            errorCount--; // Don't count duplicates as errors
          }
        }
      }
    }
    
    console.log('\n\n📊 Import Summary:');
    console.log(`   ✅ Successfully imported: ${successCount} products`);
    console.log(`   ⏭️  Skipped: ${skippedCount} products`);
    console.log(`   ❌ Errors: ${errorCount} products`);
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

