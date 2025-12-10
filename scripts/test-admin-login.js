require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function testAdminLogin() {
  try {
    const email = 'admin@biosculpture.com';
    const password = 'admin123';
    
    console.log('🔐 Testing Admin Login...\n');
    
    // Get user using raw SQL - only get columns that exist
    const users = await prisma.$queryRaw`
      SELECT id, email, password, role
      FROM "User" 
      WHERE email = ${email} 
      LIMIT 1
    `;
    
    if (!users || users.length === 0) {
      console.log('❌ User NOT FOUND in database!');
      console.log('   Creating admin account now...\n');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = require('crypto').randomUUID();
      
      await prisma.$executeRaw`
        INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt")
        VALUES (${userId}, ${email}, ${hashedPassword}, 'ADMIN', NOW(), NOW())
      `;
      
      // Create cart
      const cartId = require('crypto').randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "Cart" (id, "userId", "createdAt", "updatedAt")
        VALUES (${cartId}, ${userId}, NOW(), NOW())
      `;
      
      console.log('✅ Admin account created!');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}\n`);
      return;
    }
    
    const user = users[0];
    console.log('✅ User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password hash: ${user.password.substring(0, 30)}...\n`);
    
    // Test password
    const isValid = await compare(password, user.password);
    
    if (isValid) {
      console.log('✅ Password is CORRECT!');
      console.log('✅ Login SHOULD work!\n');
      console.log('🔍 If login still fails, checking authentication code...\n');
    } else {
      console.log('❌ Password is INCORRECT!');
      console.log('   The stored password hash does not match "admin123"\n');
      console.log('🔧 Fixing password...');
      
      const bcrypt = require('bcryptjs');
      const newHash = await bcrypt.hash(password, 10);
      
      await prisma.$executeRaw`
        UPDATE "User" 
        SET password = ${newHash}, 
            "updatedAt" = NOW()
        WHERE email = ${email}
      `;
      
      console.log('✅ Password updated!');
      console.log('   Try logging in again now.\n');
      
      // Verify the new password
      const updatedUsers = await prisma.$queryRaw`
        SELECT password FROM "User" WHERE email = ${email} LIMIT 1
      `;
      const verifyPassword = await compare(password, updatedUsers[0].password);
      if (verifyPassword) {
        console.log('✅ Password verification: SUCCESS');
      } else {
        console.log('❌ Password verification: FAILED');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.meta) {
      console.error('   Database error:', error.meta.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLogin();
