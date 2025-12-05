require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function checkSalonStatusEnum() {
  console.log('🔍 Checking SalonStatus enum in database...\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');
    
    try {
      // Query the enum type and its values
      const enumInfo = await prisma.$queryRaw`
        SELECT 
          t.typname as enum_name,
          e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname = 'SalonStatus'
        ORDER BY e.enumsortorder;
      `;
      
      if (enumInfo && enumInfo.length > 0) {
        console.log('📋 SalonStatus enum found with values:');
        enumInfo.forEach(item => {
          console.log(`   - ${item.enum_value}`);
        });
        console.log('');
        
        const expectedValues = ['PENDING_REVIEW', 'APPROVED', 'REJECTED'];
        const foundValues = enumInfo.map(item => item.enum_value);
        const missingValues = expectedValues.filter(val => !foundValues.includes(val));
        const extraValues = foundValues.filter(val => !expectedValues.includes(val));
        
        if (missingValues.length > 0) {
          console.log('❌ Missing enum values:');
          missingValues.forEach(val => console.log(`   - ${val}`));
        }
        
        if (extraValues.length > 0) {
          console.log('⚠️  Extra enum values (not in schema):');
          extraValues.forEach(val => console.log(`   - ${val}`));
        }
        
        if (missingValues.length === 0 && extraValues.length === 0) {
          console.log('✅ All enum values match the Prisma schema!');
        } else {
          console.log('\n⚠️  The enum values don\'t match the Prisma schema.');
          console.log('   You may need to run: npx prisma migrate dev');
          console.log('   Or manually update the enum if migrations don\'t work.');
        }
      } else {
        console.log('❌ SalonStatus enum not found!');
        console.log('   The status column exists but the enum type is missing.');
        console.log('   Run: npx prisma migrate dev');
      }
    } catch (error) {
      console.error('❌ Error checking enum:');
      console.error('   ' + error.message);
      console.log('\n💡 Try running: npx prisma migrate dev');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed!\n');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkSalonStatusEnum();

