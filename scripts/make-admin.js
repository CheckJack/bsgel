const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeAdmin(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    if (user.role === 'ADMIN') {
      console.log(`✅ User ${email} is already ADMIN`);
      return;
    }

    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ User ${email} updated to ADMIN!`);
    console.log(`   Role: ${updated.role}`);
    console.log('\n⚠️  User must logout and login again to see admin access!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/make-admin.js <email>');
  console.error('Example: node scripts/make-admin.js user@example.com');
  process.exit(1);
}

makeAdmin(email);

