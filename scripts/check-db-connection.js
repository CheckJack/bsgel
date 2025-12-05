require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function checkDatabase() {
  console.log('🔍 Checking database connection...\n');
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');
    
    // Check if tables exist by trying to query products
    try {
      const productCount = await prisma.product.count();
      console.log(`📦 Products in database: ${productCount}`);
      
      if (productCount === 0) {
        console.log('⚠️  No products found in database.');
        console.log('   This is normal if you haven\'t added any products yet.\n');
      }
    } catch (error) {
      if (error.message.includes('does not exist') || error.message.includes('relation')) {
        console.log('❌ Database tables not found!');
        console.log('   Run: npx prisma migrate dev --name init');
        console.log('');
        console.log('⚠️  NEVER use "npx prisma db push" - it can delete all your data!\n');
      } else {
        throw error;
      }
    }
    
    // Check categories
    try {
      const categoryCount = await prisma.category.count();
      console.log(`📁 Categories in database: ${categoryCount}\n`);
    } catch (error) {
      // Ignore if table doesn't exist
    }
    
    // Check users
    try {
      const userCount = await prisma.user.count();
      console.log(`👤 Users in database: ${userCount}\n`);
    } catch (error) {
      // Ignore if table doesn't exist
    }
    
    console.log('✅ Database is ready to use!');
    
  } catch (error) {
    console.error('❌ Database connection failed!\n');
    console.error('Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    
    if (error.message.includes('P1001') || error.message.includes('connect')) {
      console.error('   1. Make sure PostgreSQL is running');
      console.error('   2. Check your DATABASE_URL in .env.local');
      console.error('   3. Verify the database exists');
    } else if (error.message.includes('P1000') || error.message.includes('authentication')) {
      console.error('   1. Check your database username and password');
      console.error('   2. Verify DATABASE_URL format: postgresql://user:password@host:port/database');
    } else if (error.message.includes('P1003') || error.message.includes('does not exist')) {
      console.error('   1. Create the database first: createdb bio_sculpture');
      console.error('   2. Or update DATABASE_URL to point to an existing database');
    }
    
    console.error('\n📖 See SETUP_DATABASE.md for detailed setup instructions');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

