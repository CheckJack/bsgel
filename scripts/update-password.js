require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updatePassword(email, newPassword) {
  try {
    console.log(`🔐 Updating password for ${email}...\n`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    const user = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });
    
    console.log('✅ Password updated successfully!');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}\n`);
    console.log('🎉 You can now log in with the new password!\n');
    
  } catch (error) {
    if (error.code === 'P2025') {
      console.error(`❌ User with email ${email} not found!`);
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/update-password.js <email> <new-password>');
  console.error('Example: node scripts/update-password.js tiagolpc98@gmail.com Test123');
  process.exit(1);
}

updatePassword(email, password);

