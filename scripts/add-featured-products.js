require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addFeaturedProducts() {
  console.log('🌟 Adding featured products to database...\n');

  try {
    // Get or create categories
    console.log('📁 Checking categories...');
    
    let bioGelCategory = await prisma.category.findFirst({
      where: { slug: 'bio-gel' }
    });

    if (!bioGelCategory) {
      bioGelCategory = await prisma.category.create({
        data: {
          name: 'Bio Gel',
          slug: 'bio-gel',
          description: 'Bio Sculpture gel products',
        },
      });
      console.log('✅ Created Bio Gel category');
    }

    let cuticleCategory = await prisma.category.findFirst({
      where: { slug: 'cuticle-oil' }
    });

    if (!cuticleCategory) {
      cuticleCategory = await prisma.category.create({
        data: {
          name: 'Cuticle Oil',
          slug: 'cuticle-oil',
          description: 'Nourishing cuticle care products',
        },
      });
      console.log('✅ Created Cuticle Oil category');
    }

    let spaCategory = await prisma.category.findFirst({
      where: { slug: 'spa' }
    });

    if (!spaCategory) {
      spaCategory = await prisma.category.create({
        data: {
          name: 'SPA',
          slug: 'spa',
          description: 'Spa and wellness products',
        },
      });
      console.log('✅ Created SPA category');
    }

    // Featured products to add
    const featuredProducts = [
      {
        name: 'Peach Pitstop Gel Polish',
        description: 'Beautiful peach shade perfect for everyday elegance. Long-lasting formula with a high-shine finish.',
        price: 18.99,
        image: '/328 Peach Pitstop - hand and product (5).jpg',
        images: ['/328 Peach Pitstop - hand and product (5).jpg'],
        featured: true,
        categoryId: bioGelCategory.id,
      },
      {
        name: 'Tracey Gel Polish',
        description: 'A stunning neutral shade that complements any style. Professional-grade gel polish with exceptional durability.',
        price: 18.99,
        image: '/123_Tracey_Wide - Copy.jpg',
        images: ['/123_Tracey_Wide - Copy.jpg'],
        featured: true,
        categoryId: bioGelCategory.id,
      },
      {
        name: 'Nourishing Cuticle Oil',
        description: 'Deeply hydrating cuticle oil enriched with vitamin E and jojoba oil. Promotes healthy nail growth.',
        price: 12.99,
        image: '/Cuticle Oils (1).jpg',
        images: ['/Cuticle Oils (1).jpg'],
        featured: true,
        categoryId: cuticleCategory.id,
      },
      {
        name: 'Apricot Kernel Scrub',
        description: 'Exfoliating spa treatment with apricot kernel. Gently removes dead skin cells for silky smooth hands.',
        price: 24.99,
        image: '/SPA - Apricot Kernel Scrub  (21) (1).jpg',
        images: ['/SPA - Apricot Kernel Scrub  (21) (1).jpg'],
        featured: true,
        categoryId: spaCategory.id,
      },
      {
        name: 'A Breath of Fresh Air Gel',
        description: 'Fresh, vibrant gel polish in a stunning shade. Professional quality with easy application.',
        price: 18.99,
        image: '/316 A Breath of Fresh Air - Creative (3).jpg',
        images: ['/316 A Breath of Fresh Air - Creative (3).jpg'],
        featured: true,
        categoryId: bioGelCategory.id,
      },
      {
        name: 'Sunset Red Gel Polish',
        description: 'Bold and beautiful sunset red. A statement color for confident nail artistry.',
        price: 18.99,
        image: '/306_Sunset_Red_Hands.jpg',
        images: ['/306_Sunset_Red_Hands.jpg'],
        featured: true,
        categoryId: bioGelCategory.id,
      },
      {
        name: 'Cloudcha Gel Polish',
        description: 'Ethereal cloud-like finish in a soft, dreamy shade. Perfect for modern nail designs.',
        price: 18.99,
        image: '/310 CLoudcha Creative Image (8).jpg',
        images: ['/310 CLoudcha Creative Image (8).jpg'],
        featured: true,
        categoryId: bioGelCategory.id,
      },
      {
        name: 'Ethos Executive Base',
        description: 'Professional base coat for superior adhesion and protection. Essential for long-lasting manicures.',
        price: 22.99,
        image: '/Ethos - Executive Base (Bottle).png',
        images: ['/Ethos - Executive Base (Bottle).png'],
        featured: true,
        categoryId: bioGelCategory.id,
      },
    ];

    console.log('\n📦 Creating featured products...\n');
    
    let createdCount = 0;
    let skippedCount = 0;

    for (const product of featuredProducts) {
      try {
        // Check if product already exists using raw SQL
        const existing = await prisma.$queryRaw`
          SELECT id FROM "Product" WHERE name = ${product.name} LIMIT 1
        `;

        if (existing && existing.length > 0) {
          // Update existing product to be featured using raw SQL
          await prisma.$executeRaw`
            UPDATE "Product" SET featured = true WHERE id = ${existing[0].id}
          `;
          console.log(`🔄 Updated: ${product.name} (set as featured)`);
          skippedCount++;
          continue;
        }

        // Create new product using raw SQL
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
          product.categoryId
        );

        console.log(`✅ Created: ${product.name}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating "${product.name}":`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${createdCount} new products`);
    console.log(`   🔄 Updated: ${skippedCount} existing products (set as featured)`);
    console.log(`\n✅ Featured products added successfully!`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addFeaturedProducts();

