require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminRaw(email, password, name) {
  try {
    console.log('🔐 Creating Admin Account (using raw SQL)...\n');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists using raw SQL
    const existingUser = await prisma.$queryRaw`
      SELECT id, email, role FROM "User" WHERE email = ${email} LIMIT 1
    `;

    if (existingUser && existingUser.length > 0) {
      console.log('⚠️  User exists, updating to admin...');
      
      // Update user using raw SQL
      await prisma.$executeRaw`
        UPDATE "User" 
        SET password = ${hashedPassword}, 
            role = 'ADMIN',
            name = ${name || existingUser[0].name || null},
            "updatedAt" = NOW()
        WHERE email = ${email}
      `;

      console.log('✅ Admin account updated!');
      console.log(`   Email: ${email}`);
      console.log(`   Role: ADMIN\n`);
    } else {
      // Create admin user using raw SQL
      const userId = require('crypto').randomUUID();
      
      await prisma.$executeRaw`
        INSERT INTO "User" (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
        VALUES (${userId}, ${email}, ${hashedPassword}, ${name || null}, 'ADMIN', true, NOW(), NOW())
      `;

      // Create cart for user
      const cartId = require('crypto').randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "Cart" (id, "userId", "createdAt", "updatedAt")
        VALUES (${cartId}, ${userId}, NOW(), NOW())
      `;

      console.log('✅ Admin account created!');
      console.log(`   Email: ${email}`);
      console.log(`   Role: ADMIN\n`);
    }

    console.log('🎉 Login at: http://localhost:3001/login\n');
    console.log('📋 Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'P1001') {
      console.error('\n💡 Database not connected. Please:');
      console.error('   1. Update DATABASE_URL in .env.local');
      console.error('   2. Make sure PostgreSQL is running');
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
  console.error('Usage: node scripts/create-admin-raw.js <email> <password> [name]');
  console.error('Example: node scripts/create-admin-raw.js admin@example.com password123 "Admin User"');
  process.exit(1);
}

createAdminRaw(email, password, name);

