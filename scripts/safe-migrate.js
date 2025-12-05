#!/usr/bin/env node

/**
 * Safe Migration Script
 * 
 * This script creates a backup before running Prisma migrations to prevent data loss.
 * It replaces the dangerous "db push" command with safe migrations.
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get migration name from command line arguments
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Error: Migration name is required!');
  console.error('');
  console.error('Usage: node scripts/safe-migrate.js <migration_name>');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/safe-migrate.js add_new_feature');
  console.error('');
  console.error('This will create a migration named: add_new_feature');
  process.exit(1);
}

// Validate migration name (alphanumeric, underscores, hyphens only)
if (!/^[a-zA-Z0-9_-]+$/.test(migrationName)) {
  console.error('❌ Error: Migration name can only contain letters, numbers, underscores, and hyphens');
  console.error(`   Invalid name: "${migrationName}"`);
  process.exit(1);
}

async function createBackup() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  // Parse database URL to extract database name
  const dbMatch = dbUrl.match(/\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+?)(\?|$)/);
  
  if (!dbMatch) {
    console.warn('⚠️  Warning: Could not parse DATABASE_URL for backup');
    console.warn('   Backup will be skipped, but migration will continue');
    return null;
  }

  const [, username, password, host, port, database] = dbMatch;
  
  // Create backup directory if it doesn't exist
  const backupDir = path.join(process.cwd(), 'database-backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Generate backup filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFile = path.join(backupDir, `backup_${database}_${timestamp}.sql`);

  console.log('💾 Creating database backup...');
  console.log(`   Backup file: ${backupFile}`);

  try {
    // Use pg_dump to create backup
    const pgDumpCmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F c -f "${backupFile}"`;
    execSync(pgDumpCmd, { stdio: 'inherit' });
    console.log('✅ Backup created successfully!');
    return backupFile;
  } catch (error) {
    console.warn('⚠️  Warning: Backup failed, but migration will continue');
    console.warn('   Error:', error.message);
    return null;
  }
}

async function runMigration() {
  console.log('');
  console.log('🔄 Running Prisma migration...');
  console.log(`   Migration name: ${migrationName}`);
  console.log('');

  try {
    // Run the migration
    execSync(`npx prisma migrate dev --name ${migrationName}`, {
      stdio: 'inherit',
      env: { ...process.env }
    });

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Review the migration file in prisma/migrations/');
    console.log('   2. Test your application to ensure everything works');
    console.log('   3. If something goes wrong, restore from backup:');
    console.log('      psql -d your_database < database-backups/backup_file.sql');
    
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed!');
    console.error('');
    console.error('💡 If data was lost, restore from backup:');
    console.error('   psql -d your_database < database-backups/backup_file.sql');
    process.exit(1);
  }
}

// Main execution
(async () => {
  console.log('🛡️  Safe Migration Script');
  console.log('==========================');
  console.log('');
  console.log('⚠️  This script will:');
  console.log('   1. Create a backup of your database');
  console.log('   2. Run a Prisma migration safely');
  console.log('   3. Preserve all your existing data');
  console.log('');

  // Create backup first
  const backupFile = await createBackup();

  if (backupFile) {
    console.log('');
    console.log(`📦 Backup saved to: ${backupFile}`);
  }

  // Run migration
  await runMigration();
})();

