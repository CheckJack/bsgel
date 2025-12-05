require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSalonLink() {
  try {
    const userEmail = 'joanalves@gmail.com';
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      console.error(`User not found`);
      process.exit(1);
    }

    console.log(`User: ${user.name} (${user.email})`);
    console.log(`User ID: ${user.id}\n`);

    // Find salon by userId
    const salon = await prisma.salon.findUnique({
      where: { userId: user.id },
    });

    if (salon) {
      console.log(`✅ Salon found linked to user:`);
      console.log(`   Name: ${salon.name}`);
      console.log(`   Email: ${salon.email}`);
      console.log(`   UserId: ${salon.userId}`);
      console.log(`   ID: ${salon.id}`);
    } else {
      console.log(`❌ No salon found linked to this user`);
      
      // Check all salons
      const allSalons = await prisma.salon.findMany({
        select: { id: true, name: true, email: true, userId: true },
      });
      console.log(`\nAll salons:`);
      allSalons.forEach(s => {
        console.log(`   - ${s.name} (${s.email}) - userId: ${s.userId || 'null'}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSalonLink();

