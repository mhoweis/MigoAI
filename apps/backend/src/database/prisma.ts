// src/database/prisma.ts
import { PrismaClient } from '@prisma/client';
import config from '../config/env';
import logger from '../utils/logger';

const prisma = new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'], // Removed 'query' to reduce verbosity
  datasources: {
    db: {
      url: config.DATABASE_URL
    }
  }
});

// Query logging disabled to reduce verbosity
// Uncomment if you need to debug specific database queries
// if (config.NODE_ENV === 'development') {
//   prisma.$on('query' as never, (e: any) => {
//     logger.debug(`Query: ${e.query}`);
//     logger.debug(`Duration: ${e.duration}ms`);
//   });
// }

// REMOVED: prisma.$on('beforeExit' as never, ...) 
// This is not supported in Prisma 5+ library engine

export const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

// NOTE: Shutdown handlers removed to prevent duplicate handler conflicts
// All graceful shutdown logic is handled in src/server.ts

export default prisma;