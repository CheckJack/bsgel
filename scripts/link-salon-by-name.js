require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkSalonByName() {
  try {
    const userEmail = process.argv[2];
    const salonName = process.argv[3];
    
    if (!userEmail || !salonName) {
      console.error('Usage: node scripts/link-salon-by-name.js <user-email> <salon-name>');
      console.error('Example: node scripts/link-salon-by-name.js joanalves@gmail.com "Beauty Salon"');
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

    // Find salon by name
    const salon = await prisma.salon.findFirst({
      where: { name: salonName },
    });

    if (!salon) {
      console.error(`Salon "${salonName}" not found`);
      console.log('\nAvailable salons:');
      const allSalons = await prisma.salon.findMany({
        select: { id: true, name: true, email: true, userId: true },
      });
      allSalons.forEach(s => {
        console.log(`  - ${s.name} (${s.email || 'no email'}) - ${s.userId ? 'Linked' : 'Unlinked'}`);
      });
      process.exit(1);
    }

    console.log(`Found salon: ${salon.name} (currently: ${salon.email || 'no email'})`);

    // Check if salon already has a userId
    if (salon.userId) {
      if (salon.userId === user.id) {
        console.log('Salon is already linked to this user');
        // Still update the email if it's wrong
        if (salon.email !== user.email) {
          const updated = await prisma.salon.update({
            where: { id: salon.id },
            data: { email: user.email },
          });
          console.log(`✅ Updated salon email to ${user.email}`);
        }
        process.exit(0);
      } else {
        console.error(`⚠️  Salon is already linked to a different user (${salon.userId})`);
        console.log('   Use --force to override (this will unlink it from the other user)');
        if (process.argv[4] !== '--force') {
          process.exit(1);
        }
      }
    }

    // Link salon to user and update email
    const updatedSalon = await prisma.salon.update({
      where: { id: salon.id },
      data: { 
        userId: user.id,
        email: user.email, // Update email to user's account email
      },
    });

    console.log(`✅ Successfully linked salon "${updatedSalon.name}" to user ${user.email}`);
    console.log(`✅ Updated salon email to ${user.email}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

linkSalonByName();

