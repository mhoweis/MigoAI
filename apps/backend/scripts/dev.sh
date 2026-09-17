#!/bin/bash
# scripts/dev.sh

echo "🚀 Starting EventFinder Backend Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check if Docker is installed (for MySQL and Redis)
if ! command -v docker &> /dev/null; then
    echo "⚠️ Docker is not installed. Skipping container setup."
    echo "⚠️ Make sure MySQL and Redis are running locally."
else
    echo "🐳 Starting MySQL and Redis containers..."
    docker-compose up -d mysql redis
    
    # Wait for MySQL to be ready
    echo "⏳ Waiting for MySQL to be ready..."
    sleep 10
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database..."
npx ts-node prisma/seed.ts

# Start development server
echo "🚀 Starting development server..."
npm run dev