require('dotenv').config({ path: '.env.local' });

console.error('❌ ERROR: This script has been disabled to prevent data loss!');
console.error('');
console.error('⚠️  WARNING: "prisma db push" can DELETE ALL DATA when schema changes are detected!');
console.error('');
console.error('✅ SAFE ALTERNATIVE: Use Prisma Migrations instead:');
console.error('');
console.error('   1. Update your schema in prisma/schema.prisma');
console.error('   2. Run: npx prisma migrate dev --name descriptive_migration_name');
console.error('');
console.error('   This will safely apply schema changes without deleting data.');
console.error('');
console.error('📖 See DATABASE_PROTECTION.md for more information.');
process.exit(1);

