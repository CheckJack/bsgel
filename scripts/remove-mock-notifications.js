require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeMockNotifications() {
  console.log('🗑️  Removing mock/test notification data from database...\n');

  try {
    // Find notifications that look like mock/test data
    // Common patterns: test, mock, sample, demo, example, lorem, ipsum
    const mockPatterns = [
      'test',
      'mock',
      'sample',
      'demo',
      'example',
      'lorem',
      'ipsum',
      'placeholder',
      'dummy',
      'fake',
    ];

    // Build OR conditions for title and message
    const whereConditions = {
      OR: [
        ...mockPatterns.map(pattern => ({
          title: { contains: pattern, mode: 'insensitive' }
        })),
        ...mockPatterns.map(pattern => ({
          message: { contains: pattern, mode: 'insensitive' }
        })),
      ]
    };

    // Find all matching notifications
    const mockNotifications = await prisma.notification.findMany({
      where: whereConditions,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        createdAt: true,
      },
    });

    if (mockNotifications.length === 0) {
      console.log('✅ No mock notifications found in the database.');
      return;
    }

    console.log(`📋 Found ${mockNotifications.length} mock notification(s):\n`);
    mockNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. [${notif.type}] ${notif.title}`);
      console.log(`   Message: ${notif.message.substring(0, 60)}${notif.message.length > 60 ? '...' : ''}`);
      console.log(`   Created: ${notif.createdAt.toISOString()}\n`);
    });

    // Delete all mock notifications
    const result = await prisma.notification.deleteMany({
      where: whereConditions,
    });

    console.log(`✅ Successfully deleted ${result.count} mock notification(s)!`);

    // Show remaining notification count
    const remainingCount = await prisma.notification.count();
    console.log(`\n📊 Remaining notifications in database: ${remainingCount}`);

  } catch (error) {
    console.error('❌ Error removing mock notifications:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeMockNotifications();

