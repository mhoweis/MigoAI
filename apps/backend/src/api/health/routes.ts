// src/api/health/routes.ts
import { Router } from 'express';
import  config  from '../../config/env';
import prisma from '../../database/prisma';

const router = Router();

// Basic health check
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    version: '1.0.0'
  });
});

// Detailed health check with service status
router.get('/detailed', async (req, res) => {
  const services = {
    database: { status: 'unknown', latency: 0 },
    redis: { status: 'unknown', latency: 0 },
    // Add more services as needed
  };

  const startTime = Date.now();
  
  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    services.database.status = 'healthy';
    services.database.latency = Date.now() - startTime;
  } catch (error) {
    services.database.status = 'unhealthy';
    console.error('Database health check failed:', error);
  }

  const overallStatus = services.database.status === 'healthy' ? 'healthy' : 'degraded';

  res.json({
    success: overallStatus === 'healthy',
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      pid: process.pid
    }
  });
});

// Readiness probe (for Kubernetes/load balancers)
router.get('/ready', async (req, res) => {
  try {
    // Check if all required services are ready
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      ready: false,
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    alive: true,
    timestamp: new Date().toISOString()
  });
});

export default router;