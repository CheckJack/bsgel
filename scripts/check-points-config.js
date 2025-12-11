require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPointsConfig() {
  try {
    console.log('🔍 Checking Points Configuration...\n');

    const actionTypes = [
      'REFERRAL_SIGNUP',
      'REFERRAL_FIRST_ORDER',
      'REFERRAL_REPEAT_ORDER',
      'OWN_PURCHASE'
    ];

    const now = new Date();

    for (const actionType of actionTypes) {
      const configs = await prisma.pointsConfiguration.findMany({
        where: {
          actionType,
          isActive: true,
          validFrom: { lte: now },
          OR: [
            { validUntil: null },
            { validUntil: { gte: now } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      if (configs.length === 0) {
        console.log(`❌ Missing active config for: ${actionType}`);
        console.log(`   → Go to /admin/points-config to create one\n`);
      } else {
        const config = configs[0];
        console.log(`✅ ${actionType}:`);
        console.log(`   Points: ${config.pointsAmount || 'Tiered'}`);
        console.log(`   Min Order: ${config.minOrderValue || 'None'}`);
        console.log(`   Max Points: ${config.maxPointsPerTransaction || 'Unlimited'}\n`);
      }
    }

    console.log('💡 If any configs are missing, create them at /admin/points-config');
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'P1001') {
      console.error('\n💡 Database not connected. Please:');
      console.error('   1. Update DATABASE_URL in .env.local');
      console.error('   2. Run: npx prisma migrate dev --name init');
      console.error('');
      console.error('⚠️  NEVER use "npx prisma db push" - it can delete all your data!');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkPointsConfig();

