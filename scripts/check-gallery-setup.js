const { PrismaClient } = require('@prisma/client');

async function checkGallerySetup() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking Gallery setup...\n');
    
    // Check if galleryItem model exists in Prisma client
    if (prisma.galleryItem) {
      console.log('✅ Prisma Client: galleryItem model is available');
    } else {
      console.log('❌ Prisma Client: galleryItem model is NOT available');
      console.log('   Run: npx prisma generate');
      process.exit(1);
    }
    
    // Try to query the database
    try {
      const count = await prisma.galleryItem.count();
      console.log('✅ Database: GalleryItem table exists');
      console.log(`   Current items: ${count}`);
    } catch (error) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('❌ Database: GalleryItem table does NOT exist');
        console.log('   Run: npx prisma migrate dev --name add_gallery');
        console.log('');
        console.log('⚠️  NEVER use "npx prisma db push" - it can delete all your data!');
        process.exit(1);
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Gallery setup is complete!');
    console.log('   You can now upload files to the gallery.');
    
  } catch (error) {
    console.error('\n❌ Error checking gallery setup:', error.message);
    if (error.code === 'P1001') {
      console.log('\n💡 Database connection error. Check your DATABASE_URL in .env.local');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkGallerySetup();

