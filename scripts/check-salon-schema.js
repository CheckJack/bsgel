require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function checkSalonSchema() {
  console.log('🔍 Checking Salon table schema...\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');
    
    // Try to query the Salon table structure by attempting a simple query
    try {
      // Try to get the table structure by querying with all expected fields
      const testSalon = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Salon'
        ORDER BY ordinal_position;
      `;
      
      if (testSalon && testSalon.length > 0) {
        console.log('📋 Salon table columns found:');
        testSalon.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
        console.log('');
        
        // Check for required columns
        const requiredColumns = [
          'id', 'name', 'address', 'city', 'postalCode', 'phone', 'email',
          'website', 'latitude', 'longitude', 'image', 'logo', 'images',
          'description', 'workingHours', 'isActive', 'isBioDiamond', 'status',
          'rejectionReason', 'reviewedBy', 'reviewedAt', 'userId',
          'createdAt', 'updatedAt'
        ];
        
        const foundColumns = testSalon.map(col => col.column_name);
        const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));
        
        if (missingColumns.length > 0) {
          console.log('❌ Missing columns:');
          missingColumns.forEach(col => console.log(`   - ${col}`));
          console.log('\n⚠️  Run migrations: npx prisma migrate dev');
        } else {
          console.log('✅ All required columns are present!');
        }
      } else {
        console.log('❌ Salon table not found!');
        console.log('   Run: npx prisma migrate dev --name init');
        console.log('   ⚠️  NEVER use "npx prisma db push" - it can delete all your data!\n');
      }
    } catch (error) {
      if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table')) {
        console.log('❌ Salon table not found!');
        console.log('   Run: npx prisma migrate dev --name init');
        console.log('   ⚠️  NEVER use "npx prisma db push" - it can delete all your data!\n');
      } else {
        // If we can't query the schema directly, try a simple count
        try {
          await prisma.salon.count();
          console.log('✅ Salon table exists and is accessible');
        } catch (countError) {
          console.log('❌ Error accessing Salon table:');
          console.log('   ' + countError.message);
          console.log('\n💡 This usually means:');
          console.log('   1. The table doesn\'t exist - run: npx prisma migrate dev');
          console.log('   2. The schema is out of sync - run: npx prisma migrate dev');
          console.log('   3. Column names don\'t match - check your migrations\n');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Database connection failed!\n');
    console.error('Error:', error.message);
    console.error('\n💡 Check your DATABASE_URL in .env.local');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkSalonSchema();

