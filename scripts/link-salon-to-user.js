const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkSalonToUser() {
  try {
    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.error('Usage: node scripts/link-salon-to-user.js <user-email>');
      process.exit(1);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.error(`User with email ${userEmail} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user.email})`);

    // Find salon by email (try exact match first, then partial)
    let salon = await prisma.salon.findFirst({
      where: { email: userEmail },
    });

    // If not found by exact email, try to find any salon without a userId
    if (!salon) {
      console.log(`No salon found with exact email ${userEmail}, searching for unlinked salons...`);
      salon = await prisma.salon.findFirst({
        where: { userId: null },
      });
      
      if (salon) {
        console.log(`Found unlinked salon: ${salon.name} (${salon.email})`);
        const confirm = process.argv[3] === '--confirm';
        if (!confirm) {
          console.log('⚠️  To link this salon, run with --confirm flag:');
          console.log(`   node scripts/link-salon-to-user.js ${userEmail} --confirm`);
          process.exit(0);
        }
      }
    }

    if (!salon) {
      console.error(`No salon found to link`);
      console.log('\nAvailable salons:');
      const allSalons = await prisma.salon.findMany({
        select: { id: true, name: true, email: true, userId: true },
      });
      allSalons.forEach(s => {
        console.log(`  - ${s.name} (${s.email || 'no email'}) - ${s.userId ? 'Linked' : 'Unlinked'}`);
      });
      process.exit(1);
    }

    console.log(`Found salon: ${salon.name}`);

    // Check if salon already has a userId
    if (salon.userId) {
      if (salon.userId === user.id) {
        console.log('Salon is already linked to this user');
        process.exit(0);
      } else {
        console.error(`Salon is already linked to a different user (${salon.userId})`);
        process.exit(1);
      }
    }

    // Link salon to user
    const updatedSalon = await prisma.salon.update({
      where: { id: salon.id },
      data: { userId: user.id },
    });

    console.log(`✅ Successfully linked salon "${updatedSalon.name}" to user ${user.email}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

linkSalonToUser();

