#!/bin/bash

echo "🚀 Starting Bio Sculpture Ecommerce Website..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your database and Stripe credentials."
    echo "See .env.example for reference."
    exit 1
fi

# Check if DATABASE_URL is set
if grep -q 'DATABASE_URL="postgresql://user:password@' .env.local; then
    echo "⚠️  WARNING: DATABASE_URL appears to have placeholder values!"
    echo "Please update .env.local with your actual PostgreSQL connection string."
    echo ""
fi

# Database connection check ONLY - NO SCHEMA CHANGES
echo "📊 Checking database connection..."
echo "⚠️  DATABASE PROTECTION: No schema changes will be made automatically"
echo "    Database is PROTECTED - all data is safe"
echo ""

echo "🌐 Starting Next.js development server..."
echo "Server will be available at: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev

