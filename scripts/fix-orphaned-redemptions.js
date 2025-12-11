const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOrphanedRedemptions() {
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

    // Get ALL existing redemption records
    const existingRedemptions = await prisma.pointsRedemption.findMany({
      where: { userId: user.id },
      select: { id: true }
    });

    const existingRedemptionIds = new Set(existingRedemptions.map(r => r.id));

    // Find orphaned transactions (those without redemption records)
    const orphanedTransactions = redemptionTransactions.filter(tx => 
      tx.referenceId && !existingRedemptionIds.has(tx.referenceId)
    );

    console.log(`📊 Found ${orphanedTransactions.length} orphaned transactions\n`);

    if (orphanedTransactions.length === 0) {
      console.log('✅ No orphaned transactions to fix!');
      return;
    }

    // Group by rewardId (referenceId)
    const transactionsByReward = {};
    orphanedTransactions.forEach(tx => {
      const rewardId = tx.referenceId;
      if (!transactionsByReward[rewardId]) {
        transactionsByReward[rewardId] = [];
      }
      transactionsByReward[rewardId].push(tx);
    });

    console.log(`📋 Processing ${Object.keys(transactionsByReward).length} unique rewards\n`);

    let fixedCount = 0;
    let errorCount = 0;

    // Process each reward
    for (const [rewardId, transactions] of Object.entries(transactionsByReward)) {
      try {
        // Get reward details
        const reward = await prisma.reward.findUnique({
          where: { id: rewardId }
        });

        if (!reward) {
          console.log(`⚠️  Reward ${rewardId} not found, skipping ${transactions.length} transactions`);
          errorCount += transactions.length;
          continue;
        }

        console.log(`\n🔧 Processing reward: ${reward.name} (${transactions.length} transactions)`);

        // Create redemption records for each transaction
        for (const tx of transactions) {
          try {
            // Generate unique coupon code
            const couponCode = `REW${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            // Create everything in a transaction
            await prisma.$transaction(async (txClient) => {
              // Create coupon
              const coupon = await txClient.coupon.create({
                data: {
                  code: couponCode,
                  description: `Reward redemption: ${reward.name}`,
                  discountType: reward.discountType,
                  discountValue: reward.discountValue,
                  minPurchaseAmount: reward.minPurchaseAmount,
                  maxDiscountAmount: reward.maxDiscountAmount,
                  source: 'REDEMPTION',
                  validFrom: reward.validFrom,
                  validUntil: reward.validUntil || null,
                },
              });

              // Determine status
              const now = new Date();
              const isCouponValidNow = 
                (!coupon.validFrom || now >= coupon.validFrom) &&
                (!coupon.validUntil || now <= coupon.validUntil) &&
                coupon.isActive;

              // Create redemption record
              const redemption = await txClient.pointsRedemption.create({
                data: {
                  userId: user.id,
                  rewardId: reward.id,
                  pointsSpent: Math.abs(tx.amount), // Points spent (positive value)
                  couponCode,
                  couponId: coupon.id,
                  status: isCouponValidNow ? 'ACTIVE' : 'PENDING',
                },
              });

              console.log(`   ✅ Created redemption ${redemption.id} with coupon ${couponCode}`);
              fixedCount++;
            });
          } catch (error) {
            console.error(`   ❌ Failed to create redemption for transaction ${tx.id}:`, error.message);
            errorCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing reward ${rewardId}:`, error.message);
        errorCount += transactions.length;
      }
    }

    console.log(`\n\n📊 SUMMARY:`);
    console.log(`   Fixed: ${fixedCount} redemptions`);
    console.log(`   Errors: ${errorCount} transactions`);
    console.log(`   Total processed: ${orphanedTransactions.length}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrphanedRedemptions();

