const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserCoupons() {
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

    // Count all redemptions for this user
    const redemptionCount = await prisma.pointsRedemption.count({
      where: { userId: user.id }
    });

    // Get all redemptions with coupon details
    const redemptions = await prisma.pointsRedemption.findMany({
      where: { userId: user.id },
      include: {
        coupon: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
            isActive: true,
            usedCount: true,
            validFrom: true,
            validUntil: true,
          }
        },
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

    console.log(`📊 TOTAL REDEMPTIONS: ${redemptionCount}`);
    console.log(`\n📋 Redemption Details:\n`);

    redemptions.forEach((redemption, index) => {
      const coupon = redemption.coupon;
      const hasCoupon = !!coupon;
      
      console.log(`${index + 1}. Redemption ID: ${redemption.id}`);
      console.log(`   Coupon Code: ${redemption.couponCode}`);
      console.log(`   Coupon ID: ${redemption.couponId}`);
      console.log(`   Has Coupon in DB: ${hasCoupon ? '✅ YES' : '❌ NO'}`);
      if (coupon) {
        console.log(`   Coupon Code from DB: ${coupon.code}`);
        console.log(`   Discount: ${coupon.discountType === 'PERCENTAGE' ? coupon.discountValue + '%' : '€' + coupon.discountValue}`);
        console.log(`   Active: ${coupon.isActive ? 'Yes' : 'No'}`);
        console.log(`   Used Count: ${coupon.usedCount}`);
        console.log(`   Valid From: ${coupon.validFrom}`);
        console.log(`   Valid Until: ${coupon.validUntil || 'No expiry'}`);
      }
      console.log(`   Reward: ${redemption.reward?.name || 'N/A'}`);
      console.log(`   Points Spent: ${redemption.pointsSpent}`);
      console.log(`   Status: ${redemption.status}`);
      console.log(`   Created: ${redemption.createdAt}`);
      console.log('');
    });

    // Count redemptions WITH valid coupons
    const redemptionsWithCoupons = redemptions.filter(r => r.coupon !== null).length;
    const redemptionsWithoutCoupons = redemptions.filter(r => r.coupon === null).length;

    console.log(`\n📈 Summary:`);
    console.log(`   Total Redemptions: ${redemptionCount}`);
    console.log(`   Redemptions WITH coupons: ${redemptionsWithCoupons}`);
    console.log(`   Redemptions WITHOUT coupons: ${redemptionsWithoutCoupons} ⚠️`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P1001') {
      console.error('\n💡 Database connection failed. Check your DATABASE_URL in .env.local');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkUserCoupons();

