require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listData() {
  try {
    console.log('📋 Users:');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    });
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.name || 'no name'}) - ${u.role}`);
    });

    console.log('\n📋 Salons:');
    const salons = await prisma.salon.findMany({
      select: { id: true, name: true, email: true, userId: true },
    });
    salons.forEach(s => {
      console.log(`  - ${s.name} (${s.email || 'no email'}) - ${s.userId ? 'Linked to user' : 'Unlinked'}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listData();

