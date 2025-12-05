require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyProducts() {
  try {
    const totalProducts = await prisma.product.count();
    console.log(`\n📦 Total products in database: ${totalProducts}\n`);
    
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('📁 Categories:');
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat._count.products} products)`);
    });
    
    // Show a few sample products
    console.log('\n📋 Sample products:');
    const sampleProducts = await prisma.product.findMany({
      take: 5,
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    });
    
    sampleProducts.forEach(product => {
      console.log(`   - ${product.name} (${product.price}€) - Category: ${product.category?.name || 'None'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyProducts();

