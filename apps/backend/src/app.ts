// src/app.ts - UPDATED WITH FIXED AI ROUTES
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

// Load environment variables
dotenv.config();

// Import routes
import { authRouter } from './routes/auth.routes';
import { eventsRouter } from './routes/events.routes';
import { usersRouter } from './routes/users.routes';
import { aiRouter } from './routes/ai.routes';
import { paymentsRouter } from './routes/payments.routes';
import externalEventsRouter from './routes/external-events.routes';
import wishlistsRouter from './routes/wishlists.routes';

// Import middleware
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { authenticate } from './middlewares/auth.middleware';

// Import Prisma instance
import prisma from './config/database';

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration for React Native mobile apps
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      callback(null, true);
      return;
    }

    // List of allowed origins for React Native development
    const allowedOrigins = [
      // iOS Simulator & Physical iOS
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      // Android Emulator
      'http://10.0.2.2:8081',
      'http://localhost:19006',
      // Expo Web
      'http://localhost:19006',
      'http://localhost:19000',
      // Production/Staging clients (add your domains here)
      process.env.CLIENT_URL,
    ].filter(Boolean); // Remove undefined values

    // Check if the origin is in allowed list or if we're in development
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['Authorization'], // Important for React Native to read custom headers
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (disabled for development to avoid connection issues)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api/', limiter);
}

// Logging - enhanced for debugging
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Set Prisma instance on the app for use in routes
app.set('prisma', prisma);

// Health check endpoint with more details
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'success',
      message: 'Migo Backend Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      corsAllowed: true,
      platform: process.platform,
      database: 'connected', // Add database connection check
    },
  });
});

// Debug endpoint for network testing
app.get('/api/debug/headers', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      headers: req.headers,
      ip: req.ip,
      hostname: req.hostname,
      originalUrl: req.originalUrl,
    },
  });
});

// API Routes

// Public routes (no authentication required)
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter); // Assuming events are public for browsing

// Protected routes (authentication required)
app.use('/api/users', authenticate, usersRouter);
app.use('/api/payments', authenticate, paymentsRouter);
app.use('/api/external-events', externalEventsRouter);
app.use('/api/wishlists', wishlistsRouter);

// AI Routes - using internal authentication (NOT global authenticate middleware)
app.use('/api/ai', aiRouter);

// 404 handler for undefined routes
app.all(/.*/, (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;