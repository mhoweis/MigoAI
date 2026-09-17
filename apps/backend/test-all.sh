#!/bin/bash

echo "🧪 MIGO Backend Comprehensive Test Suite"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ $2${NC}"
  else
    echo -e "${RED}✗ $2${NC}"
    exit 1
  fi
}

# 1. Check Node.js version
echo "1. Checking Node.js version..."
node --version
print_status $? "Node.js check"

# 2. Check npm packages
echo "2. Checking npm packages..."
npm list --depth=0 2>/dev/null | grep -E "(prisma|express|mysql)"
print_status $? "npm packages check"

# 3. Check MySQL
echo "3. Checking MySQL connection..."
mysql -u root -p -e "USE event_booking_db; SELECT 'MySQL is running' as status;" 2>/dev/null
print_status $? "MySQL connection"

# 4. Generate Prisma Client
echo "4. Generating Prisma client..."
npx prisma generate > /dev/null 2>&1
print_status $? "Prisma generate"

# 5. Run TypeScript compilation
echo "5. Compiling TypeScript..."
npx tsc --noEmit
print_status $? "TypeScript compilation"

# 6. Start server in background
echo "6. Starting server..."
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# 7. Test server health
echo "7. Testing server health..."
curl -s http://localhost:8080/health | grep -q "healthy"
print_status $? "Server health check"

# 8. Test API endpoints
echo "8. Testing API endpoints..."

# Test public endpoints
curl -s http://localhost:8080/api-docs | grep -q "MIGO API"
print_status $? "API docs endpoint"

# Test events endpoint
curl -s http://localhost:8080/api/v1/events | grep -q '"success"\|"data"'
print_status $? "Events endpoint"

# 9. Test database operations
echo "9. Testing database operations..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    // Test connection
    await prisma.\$connect();
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-db-' + Date.now() + '@example.com',
        name: 'Database Test User',
        preferences: { test: true }
      }
    });
    console.log('User created:', user.id);
    
    // Create test event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event ' + Date.now(),
        description: 'Test event description',
        category: 'test',
        date: new Date(Date.now() + 86400000), // Tomorrow
        location: { city: 'Test City', country: 'Test Country' },
        priceRange: { min: 0, max: 100, currency: 'USD' },
        images: ['test.jpg'],
        facilities: ['Test Facility'],
        organizerId: user.id
      }
    });
    console.log('Event created:', event.id);
    
    // Clean up
    await prisma.event.delete({ where: { id: event.id } });
    await prisma.user.delete({ where: { id: user.id } });
    
    await prisma.\$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Database test failed:', error);
    process.exit(1);
  }
}

test();
"
print_status $? "Database operations"

# 10. Stop server
echo "10. Stopping server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
print_status $? "Server shutdown"

echo -e "\n${GREEN}🎉 All tests passed!${NC}"
echo "========================================"