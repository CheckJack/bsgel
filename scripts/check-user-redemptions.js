const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserRedemptions() {
  try {
    const email = 'info@uptnable.com';
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    if (!user) {
      console.log(`❌ User with email ${email} NOT FOUND`);
      return;
    }

    console.log(`\n✅ Found user: ${user.name || 'No name'} (${user.email})`);
    console.log(`   User ID: ${user.id}\n`);

    // Get ALL points transactions of type REDEMPTION
    const redemptionTransactions = await prisma.pointsTransaction.findMany({
      where: {
        userId: user.id,
        type: 'REDEMPTION'
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 TOTAL REDEMPTION TRANSACTIONS: ${redemptionTransactions.length}\n`);

    // Get ALL redemption records
    const allRedemptions = await prisma.pointsRedemption.findMany({
      where: { userId: user.id },
      include: {
        coupon: true,
        reward: {
          select: {
            name: true,
            discountValue: true,
            discountType: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 TOTAL REDEMPTION RECORDS: ${allRedemptions.length}\n`);

    console.log(`\n🔍 COMPARISON:\n`);
    console.log(`   Points Transactions (REDEMPTION type): ${redemptionTransactions.length}`);
    console.log(`   PointsRedemption records: ${allRedemptions.length}`);
    console.log(`   Missing Redemption Records: ${redemptionTransactions.length - allRedemptions.length}\n`);

    console.log(`\n📋 Points Transactions Details:\n`);
    redemptionTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. Transaction ID: ${tx.id}`);
      console.log(`   Amount: ${tx.amount} points`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Reference ID: ${tx.referenceId}`);
      console.log(`   Created: ${tx.createdAt}`);
      console.log('');
    });

    console.log(`\n📋 Redemption Records Details:\n`);
    allRedemptions.forEach((redemption, index) => {
      console.log(`${index + 1}. Redemption ID: ${redemption.id}`);
      console.log(`   Coupon Code: ${redemption.couponCode}`);
      console.log(`   Coupon ID: ${redemption.couponId}`);
      console.log(`   Has Coupon: ${redemption.coupon ? '✅ YES' : '❌ NO'}`);
      if (redemption.coupon) {
        console.log(`   Coupon Code from DB: ${redemption.coupon.code}`);
        console.log(`   Discount: ${redemption.coupon.discountType === 'PERCENTAGE' ? redemption.coupon.discountValue + '%' : '€' + redemption.coupon.discountValue}`);
      }
      console.log(`   Reward: ${redemption.reward?.name || 'N/A'}`);
      console.log(`   Points Spent: ${redemption.pointsSpent}`);
      console.log(`   Created: ${redemption.createdAt}`);
      console.log('');
    });

    // Check if there are transactions without corresponding redemption records
    const transactionReferenceIds = new Set(redemptionTransactions.map(tx => tx.referenceId).filter(Boolean));
    const redemptionIds = new Set(allRedemptions.map(r => r.id));
    
    const orphanedTransactions = redemptionTransactions.filter(tx => 
      tx.referenceId && !redemptionIds.has(tx.referenceId)
    );

    console.log(`\n⚠️  ORPHANED TRANSACTIONS (no redemption record): ${orphanedTransactions.length}\n`);
    orphanedTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. Transaction ID: ${tx.id}`);
      console.log(`   Reference ID: ${tx.referenceId} (NOT FOUND IN REDEMPTIONS)`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Created: ${tx.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    if (error.code === 'P1001') {
      console.error('\n💡 Database connection failed. Check your DATABASE_URL in .env.local');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRedemptions();

