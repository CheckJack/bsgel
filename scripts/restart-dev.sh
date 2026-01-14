#!/bin/bash

# Script to properly restart the dev server after a build
# This ensures the dev server has a clean state

echo "🔄 Restarting development server..."
echo ""

# Kill any running Next.js dev servers
echo "Stopping existing dev servers..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Clean the .next directory to remove production build artifacts
echo "Cleaning .next directory..."
rm -rf .next

# Start the dev server
echo "Starting fresh dev server on port 3001..."
echo ""
npm run dev

