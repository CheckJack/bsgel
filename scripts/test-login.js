require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const email = 'tiagolpc98@gmail.com';
    const password = 'Test123';
    
    console.log('🔐 Testing login credentials...\n');
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log(`✅ User found: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...\n`);
    
    const isValid = await compare(password, user.password);
    
    if (isValid) {
      console.log('✅ Password is CORRECT! Login should work.');
      console.log(`\n📋 Login credentials:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    } else {
      console.log('❌ Password is INCORRECT!');
      console.log('   The password in database does not match "Test123"');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();

