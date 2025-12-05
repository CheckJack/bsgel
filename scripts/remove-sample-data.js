require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeSampleData() {
  console.log('🗑️  Removing sample/mock data from database...\n');

  try {
    // Delete sample categories and their products
    const sampleCategorySlugs = ['nail-polish', 'cuticle-oil', 'base-coat'];
    
    console.log('📁 Removing sample categories...');
    for (const slug of sampleCategorySlugs) {
      const category = await prisma.category.findUnique({
        where: { slug },
        include: { products: true }
      });
      
      if (category) {
        // Delete products in this category first
        if (category.products.length > 0) {
          console.log(`   Deleting ${category.products.length} products in "${category.name}"...`);
          await prisma.product.deleteMany({
            where: { categoryId: category.id }
          });
        }
        
        // Delete the category
        await prisma.category.delete({
          where: { slug }
        });
        console.log(`   ✅ Deleted category: ${category.name}`);
      }
    }

    // Delete any sample products that might have been created
    const sampleProductNames = [
      'Classic Red Nail Polish',
      'Nude Beige Nail Polish',
      'Deep Plum Nail Polish',
      'Nourishing Cuticle Oil',
      'Professional Base Coat',
      'Pink Blush Nail Polish'
    ];

    console.log('\n📦 Removing sample products...');
    for (const name of sampleProductNames) {
      const deleted = await prisma.product.deleteMany({
        where: { name }
      });
      if (deleted.count > 0) {
        console.log(`   ✅ Deleted product: ${name}`);
      }
    }

    console.log('\n✅ Sample data removed successfully!');
    console.log('\n📊 Current database state:');
    const categoryCount = await prisma.category.count();
    const productCount = await prisma.product.count();
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Products: ${productCount}`);

  } catch (error) {
    console.error('❌ Error removing sample data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeSampleData();

