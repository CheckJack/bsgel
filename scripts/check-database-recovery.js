require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('🔍 Checking database recovery options...\n');

// Detect database provider
const url = DATABASE_URL.toLowerCase();

if (url.includes('supabase')) {
  console.log('📊 Database Provider: SUPABASE');
  console.log('\n✅ RECOVERY OPTIONS AVAILABLE:');
  console.log('   1. Supabase has Point-in-Time Recovery (PITR)');
  console.log('   2. Go to your Supabase Dashboard: https://app.supabase.com');
  console.log('   3. Navigate to: Project Settings > Database > Backups');
  console.log('   4. You can restore to a previous point in time');
  console.log('   5. Or use the "Restore" feature to recover your data');
  console.log('\n📝 Steps:');
  console.log('   - Login to Supabase Dashboard');
  console.log('   - Select your project');
  console.log('   - Go to Database > Backups');
  console.log('   - Find a backup from BEFORE the data loss');
  console.log('   - Click "Restore" to recover your data');
  
} else if (url.includes('neon.tech') || url.includes('neon')) {
  console.log('📊 Database Provider: NEON');
  console.log('\n✅ RECOVERY OPTIONS AVAILABLE:');
  console.log('   1. Neon has automatic backups and branching');
  console.log('   2. Go to your Neon Dashboard: https://console.neon.tech');
  console.log('   3. Navigate to: Branches or Backups');
  console.log('   4. You can create a branch from a previous point');
  console.log('   5. Or restore from a backup');
  console.log('\n📝 Steps:');
  console.log('   - Login to Neon Dashboard');
  console.log('   - Select your project');
  console.log('   - Go to Branches or use the Time Travel feature');
  console.log('   - Create a branch from before the data loss');
  console.log('   - Export data from that branch');
  
} else if (url.includes('railway')) {
  console.log('📊 Database Provider: RAILWAY');
  console.log('\n✅ RECOVERY OPTIONS AVAILABLE:');
  console.log('   1. Railway may have automatic backups');
  console.log('   2. Go to your Railway Dashboard: https://railway.app');
  console.log('   3. Check your PostgreSQL service for backup options');
  console.log('   4. Look for "Backups" or "Snapshots" section');
  
} else if (url.includes('localhost') || url.includes('127.0.0.1')) {
  console.log('📊 Database Provider: LOCAL POSTGRESQL');
  console.log('\n⚠️  RECOVERY OPTIONS:');
  console.log('   1. Check if you have PostgreSQL WAL (Write-Ahead Logging) enabled');
  console.log('   2. Check for backup files in PostgreSQL data directory');
  console.log('   3. Look for pg_dump files you may have created');
  console.log('\n📝 Check for backups:');
  console.log('   - Look in: ~/backups/ or /var/backups/');
  console.log('   - Check for .sql or .dump files');
  console.log('   - Check PostgreSQL data directory for WAL files');
  console.log('\n💡 If you have a backup file:');
  console.log('   psql -d your_database < backup_file.sql');
  
} else {
  console.log('📊 Database Provider: UNKNOWN');
  console.log('\n⚠️  Check your database provider documentation for:');
  console.log('   - Point-in-Time Recovery (PITR)');
  console.log('   - Automatic backups');
  console.log('   - Database snapshots');
  console.log('   - Time travel / branching features');
}

console.log('\n🔍 Checking for local backup files...\n');

const fs = require('fs');
const path = require('path');

const backupDirs = [
  path.join(process.cwd(), 'backups'),
  path.join(process.cwd(), 'database-backups'),
  path.join(process.cwd(), '..', 'backups'),
  path.join(process.cwd(), '..', 'database-backups'),
];

let foundBackups = false;

for (const dir of backupDirs) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => 
      f.endsWith('.sql') || f.endsWith('.dump') || f.endsWith('.backup')
    );
    if (files.length > 0) {
      foundBackups = true;
      console.log(`✅ Found backup directory: ${dir}`);
      files.forEach(file => {
        const stats = fs.statSync(path.join(dir, file));
        console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB, modified: ${stats.mtime.toLocaleString()})`);
      });
    }
  }
}

if (!foundBackups) {
  console.log('❌ No local backup files found');
}

console.log('\n📋 SUMMARY:');
console.log('   - Sample data has been removed');
console.log('   - Your original data may be recoverable from your database provider');
console.log('   - Check the recovery options above based on your provider');
console.log('\n💡 PREVENTION:');
console.log('   - Set up automatic backups');
console.log('   - Never use --accept-data-loss flag');
console.log('   - Use migrations instead of db push for schema changes');

