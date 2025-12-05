require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('🔍 Checking database connection and user accounts...\n');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful\n');
    
    // Check if User table exists and has data
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}\n`);
    
    if (userCount === 0) {
      console.log('❌ NO USERS FOUND - Your account was deleted when the database was reset!\n');
      console.log('💡 You need to recreate your account:\n');
      console.log('   1. Go to: http://localhost:3000/register');
      console.log('   2. Register with: tiagolpc98@gmail.com');
      console.log('   3. Then make yourself admin (see below)\n');
    } else {
      // List all users
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('👥 Users in database:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'}) - Role: ${user.role}`);
      });
      
      // Check for specific user
      const yourUser = await prisma.user.findUnique({
        where: { email: 'tiagolpc98@gmail.com' }
      });
      
      if (yourUser) {
        console.log(`\n✅ Your account EXISTS: ${yourUser.email}`);
        console.log(`   Role: ${yourUser.role}`);
        console.log(`   Created: ${yourUser.createdAt}`);
        console.log('\n🔐 If you can\'t log in, the password might have been reset.');
        console.log('   Try resetting your password or check if the password hash was affected.\n');
      } else {
        console.log(`\n❌ Your account (tiagolpc98@gmail.com) NOT FOUND`);
        console.log('   It was deleted when the database was reset.\n');
        console.log('💡 You need to recreate your account:\n');
        console.log('   1. Go to: http://localhost:3000/register');
        console.log('   2. Register with: tiagolpc98@gmail.com');
        console.log('   3. Then run: npm run make-admin tiagolpc98@gmail.com\n');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    if (error.code === 'P1001') {
      console.error('\n💡 Database connection failed. Check:');
      console.error('   1. Is PostgreSQL running? (brew services list)');
      console.error('   2. Is DATABASE_URL correct in .env.local?');
      console.error('   3. Does the database exist?');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();

