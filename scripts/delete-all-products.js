require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllProducts() {
  console.log('🗑️  Deleting all products from database...\n');

  try {
    // First, count current products
    const productCount = await prisma.product.count();
    console.log(`📊 Found ${productCount} products in database\n`);

    if (productCount === 0) {
      console.log('✅ No products to delete. Database is already empty.');
      return;
    }

    // Delete in this order to respect foreign key constraints:
    // 1. Delete cart items (they reference products)
    console.log('🛒 Deleting cart items...');
    const cartItemsDeleted = await prisma.cartItem.deleteMany({});
    console.log(`   ✅ Deleted ${cartItemsDeleted.count} cart items`);

    // 2. Delete order items (they reference products)
    console.log('📦 Deleting order items...');
    const orderItemsDeleted = await prisma.orderItem.deleteMany({});
    console.log(`   ✅ Deleted ${orderItemsDeleted.count} order items`);

    // 3. Delete product subcategories (junction table) - if it exists
    console.log('🏷️  Deleting product subcategories...');
    try {
      const subcategoriesDeleted = await prisma.productSubcategory.deleteMany({});
      console.log(`   ✅ Deleted ${subcategoriesDeleted.count} product subcategories`);
    } catch (error) {
      if (error.code === 'P2021') {
        console.log('   ⏭️  ProductSubcategory table does not exist, skipping...');
      } else {
        throw error;
      }
    }

    // 4. Finally, delete all products
    console.log('📦 Deleting products...');
    const productsDeleted = await prisma.product.deleteMany({});
    console.log(`   ✅ Deleted ${productsDeleted.count} products`);

    console.log('\n✅ All products deleted successfully!');
    console.log('\n📊 Final database state:');
    const finalProductCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    console.log(`   Products: ${finalProductCount}`);
    console.log(`   Categories: ${categoryCount} (preserved)`);

  } catch (error) {
    console.error('❌ Error deleting products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deletion
deleteAllProducts()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

