require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSampleData() {
  console.log('🌱 Adding sample data to database...\n');

  try {
    // Create sample categories
    console.log('📁 Creating categories...');
    const category1 = await prisma.category.upsert({
      where: { slug: 'nail-polish' },
      update: {},
      create: {
        name: 'Nail Polish',
        slug: 'nail-polish',
        description: 'Professional nail polish collection',
        icon: '💅',
      },
    });

    const category2 = await prisma.category.upsert({
      where: { slug: 'cuticle-oil' },
      update: {},
      create: {
        name: 'Cuticle Oil',
        slug: 'cuticle-oil',
        description: 'Nourishing cuticle care products',
        icon: '✨',
      },
    });

    const category3 = await prisma.category.upsert({
      where: { slug: 'base-coat' },
      update: {},
      create: {
        name: 'Base Coat',
        slug: 'base-coat',
        description: 'Base coat products for nail preparation',
        icon: '🎨',
      },
    });

    console.log(`✅ Created ${3} categories\n`);

    // Create sample products
    console.log('📦 Creating products...');
    
    const products = [
      {
        name: 'Classic Red Nail Polish',
        description: 'A timeless classic red nail polish with long-lasting formula',
        price: 12.99,
        image: '/logo.png',
        images: ['/logo.png'],
        featured: true,
        categoryId: category1.id,
      },
      {
        name: 'Nude Beige Nail Polish',
        description: 'Elegant nude beige shade perfect for everyday wear',
        price: 12.99,
        image: '/logo.png',
        images: ['/logo.png'],
        featured: true,
        categoryId: category1.id,
      },
      {
        name: 'Deep Plum Nail Polish',
        description: 'Rich deep plum color for sophisticated looks',
        price: 12.99,
        image: '/logo.png',
        images: ['/logo.png'],
        featured: false,
        categoryId: category1.id,
      },
      {
        name: 'Nourishing Cuticle Oil',
        description: 'Hydrating cuticle oil with vitamin E and jojoba oil',
        price: 8.99,
        image: '/logo.png',
        images: ['/logo.png'],
        featured: true,
        categoryId: category2.id,
      },
      {
        name: 'Professional Base Coat',
        description: 'Strengthening base coat that protects and extends wear',
        price: 10.99,
        image: '/logo.png',
        images: ['/logo.png'],
        featured: false,
        categoryId: category3.id,
      },
      {
        name: 'Pink Blush Nail Polish',
        description: 'Soft pink blush shade for a delicate look',
        price: 12.99,
        image: '/logo.png',
        images: ['/logo.png'],
        featured: false,
        categoryId: category1.id,
      },
    ];

    for (const product of products) {
      await prisma.product.create({
        data: product,
      });
    }

    console.log(`✅ Created ${products.length} products\n`);

    // Summary
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();

    console.log('📊 Database Summary:');
    console.log(`   Products: ${productCount}`);
    console.log(`   Categories: ${categoryCount}\n`);
    console.log('✅ Sample data added successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Visit http://localhost:3000/products to see products');
    console.log('   2. Visit http://localhost:3000/admin/products to manage products');
    console.log('   3. Login as admin to add/edit products');

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleData();

