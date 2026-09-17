import { PrismaClient } from '@prisma/client';
import { config } from '../src/config/env';

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test raw query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Raw query test passed:', result);
    
    // Test User model
    const users = await prisma.user.count();
    console.log(`📊 Users in database: ${users}`);
    
    // Test Event model
    const events = await prisma.event.count();
    console.log(`📊 Events in database: ${events}`);
    
    await prisma.$disconnect();
    console.log('✅ All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testDatabaseConnection();