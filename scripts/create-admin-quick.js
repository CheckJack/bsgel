require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminQuick(email, password, name) {
  try {
    console.log('🔐 Creating Admin Account...\n');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  User exists, updating to admin...');
      
      const user = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          name: name || existingUser.name,
        },
      });

      console.log('✅ Admin account updated!');
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}\n`);
    } else {
      // Create admin user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
          role: 'ADMIN',
        },
      });

      // Create cart for user
      await prisma.cart.create({
        data: {
          userId: user.id,
        },
      });

      console.log('✅ Admin account created!');
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}\n`);
    }

    console.log('🎉 Login at: http://localhost:3000/login\n');
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

// Get arguments from command line
const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || null;

if (!email || !password) {
  console.error('Usage: node scripts/create-admin-quick.js <email> <password> [name]');
  console.error('Example: node scripts/create-admin-quick.js admin@example.com password123 "Admin User"');
  process.exit(1);
}

createAdminQuick(email, password, name);

