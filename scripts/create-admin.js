const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdmin() {
  try {
    console.log('🔐 Creating Admin Account for Bio Sculpture\n');

    // Get user input
    const email = await question('Enter email address: ');
    const password = await question('Enter password (min 6 characters): ');
    const name = await question('Enter name (optional, press Enter to skip): ') || null;

    if (!email || !password) {
      console.error('❌ Email and password are required!');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters!');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('\n⚠️  User already exists! Updating to admin...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update user to admin
      const user = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          name: name || existingUser.name,
        },
      });

      console.log('✅ User updated to admin successfully!');
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'ADMIN',
        },
      });

      // Create cart for user
      await prisma.cart.create({
        data: {
          userId: user.id,
        },
      });

      console.log('\n✅ Admin account created successfully!');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log('\n🎉 You can now login at: http://localhost:3000/login');
    }
  } catch (error) {
    console.error('\n❌ Error creating admin account:');
    console.error(error.message);
    
    if (error.code === 'P1001') {
      console.error('\n💡 Database connection failed. Please:');
      console.error('   1. Make sure PostgreSQL is running');
      console.error('   2. Update DATABASE_URL in .env.local');
      console.error('   3. Run: npx prisma migrate dev --name init');
      console.error('');
      console.error('⚠️  NEVER use "npx prisma db push" - it can delete all your data!');
    }
    
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdmin();

