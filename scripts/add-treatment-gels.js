require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTreatmentGels() {
  console.log('🌱 Adding Treatment Gel products to database...\n');

  try {
    // Find or create BIO Gel category using raw SQL to avoid schema issues
    console.log('📁 Finding or creating BIO Gel category...');
    
    // Use raw SQL to find category
    const categories = await prisma.$queryRaw`
      SELECT id, name, slug, description
      FROM "Category"
      WHERE LOWER(name) = 'bio gel' 
         OR LOWER(name) = 'biogel'
         OR LOWER(slug) = 'bio-gel'
      LIMIT 1
    `;
    
    let bioGelCategory = categories && categories.length > 0 ? categories[0] : null;

    if (!bioGelCategory) {
      // Create category using raw SQL
      const newCategory = await prisma.$queryRaw`
        INSERT INTO "Category" (id, name, slug, description, "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, 'BIO Gel', 'bio-gel', 'BIO Gel treatment and color products', NOW(), NOW())
        RETURNING id, name, slug, description
      `;
      bioGelCategory = newCategory[0];
      console.log('✅ Created BIO Gel category\n');
    } else {
      console.log(`✅ Found existing BIO Gel category: ${bioGelCategory.name}\n`);
    }

    // Treatment gel products to add
    const treatmentGels = [
      {
        name: 'Base Gel Treatment Gel',
        description: 'Base gel or gel de base soft gel for professional nail treatment',
        price: 0.00,
        image: '/logo.png',
        featured: false,
      },
      {
        name: 'Gel de Base Soft Gel Treatment Gel',
        description: 'Base gel or gel de base soft gel for professional nail treatment',
        price: 0.00,
        image: '/logo.png',
        featured: false,
      },
      {
        name: 'Builder Gel Treatment Gel',
        description: 'Professional builder gel for strengthening and shaping nails',
        price: 0.00,
        image: '/logo.png',
        featured: false,
      },
      {
        name: 'Apex Gel Treatment Gel',
        description: 'Apex gel for creating the perfect nail apex and structure',
        price: 0.00,
        image: '/logo.png',
        featured: false,
      },
      {
        name: 'Conditioning Gel Treatment Gel',
        description: 'Conditioning gel to nourish and strengthen natural nails',
        price: 0.00,
        image: '/logo.png',
        featured: false,
      },
      {
        name: 'Free Edge Gel Treatment Gel',
        description: 'Free edge gel for protecting and strengthening the nail tip',
        price: 0.00,
        image: '/logo.png',
        featured: false,
      },
      {
        name: 'Gloss Gel Treatment Gel',
        description: 'Gloss gel or top coat for a long-lasting, glossy finish',
        price: 0.00,
        image: '/logo.png',
        featured: false,
      },
      {
        name: 'Top Coat Treatment Gel',
        description: 'Top coat or gloss gel for a long-lasting, glossy finish',
        price: 0.00,
        image: '/logo.png',
        featured: false,
      },
    ];

    console.log('📦 Creating treatment gel products...\n');
    let createdCount = 0;
    let skippedCount = 0;

    for (const product of treatmentGels) {
      try {
        // Check if product already exists using raw SQL
        const existing = await prisma.$queryRaw`
          SELECT id FROM "Product" WHERE name = ${product.name} LIMIT 1
        `;

        if (existing && existing.length > 0) {
          console.log(`⏭️  Skipping "${product.name}" - already exists`);
          skippedCount++;
          continue;
        }

        // Create product using raw SQL to avoid schema issues
        const imagesArray = product.images || [];
        const imagesValue = imagesArray.length > 0 
          ? `ARRAY[${imagesArray.map(img => `'${String(img).replace(/'/g, "''")}'`).join(',')}]::text[]`
          : `ARRAY[]::text[]`;
        
        await prisma.$executeRawUnsafe(`
          INSERT INTO "Product" (
            id, name, description, price, image, images, featured, "categoryId", "createdAt", "updatedAt"
          )
          VALUES (
            gen_random_uuid()::text,
            $1::text,
            $2::text,
            $3::numeric,
            $4::text,
            ${imagesValue},
            $5::boolean,
            $6::text,
            NOW(),
            NOW()
          )
        `, 
          product.name,
          product.description || null,
          product.price,
          product.image || null,
          product.featured,
          bioGelCategory.id
        );

        console.log(`✅ Created: ${product.name}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating "${product.name}":`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${createdCount} products`);
    console.log(`   ⏭️  Skipped: ${skippedCount} products (already exist)`);
    console.log(`\n✅ Treatment gel products added successfully!`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addTreatmentGels();

