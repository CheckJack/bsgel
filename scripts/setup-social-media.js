#!/usr/bin/env node

/**
 * Setup script for Social Media feature
 * This script will create the necessary database tables for the social media feature
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Social Media feature...\n');

try {
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env file not found. Please create one with DATABASE_URL.');
    process.exit(1);
  }

  console.log('📦 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('\n🗄️  Creating migration for Social Media feature...');
  console.log('⚠️  Using safe migration instead of db push to protect your data');
  execSync('npx prisma migrate dev --name add_social_media_posts', { stdio: 'inherit' });

  console.log('\n✅ Social Media feature setup complete!');
  console.log('   You can now use the social media management page.');
} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  console.log('\n💡 Manual setup:');
  console.log('   1. Run: npx prisma generate');
  console.log('   2. Run: npx prisma migrate dev --name add_social_media_posts');
  console.log('');
  console.log('⚠️  NEVER use "npx prisma db push" - it can delete all your data!');
  process.exit(1);
}

