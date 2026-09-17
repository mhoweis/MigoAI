// // src/server.ts
// import * as dotenv from 'dotenv';
// dotenv.config();

// import express from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import rateLimit from 'express-rate-limit';
// import { createServer } from 'http';
// import { Server } from 'socket.io';

// // Import configuration - FIXED to use proper config
// import config from './config/env';

// // Import the new API router
// import apiRouter from './api';

// const app = express();

// // Security middleware
// app.use(helmet());

// // CORS configuration - More secure approach
// const corsOptions = {
//   origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
//     // Allow requests with no origin (like mobile apps, curl, postman)
//     if (!origin && process.env.NODE_ENV === 'development') {
//       return callback(null, true);
//     }

//     const allowedOrigins = [
//       'http://localhost:3000',           // Web frontend
//       'http://localhost:19006',          // Expo web
//       'http://localhost:19000',          // Expo dev server
//       'http://localhost:3001',           // Alternative port
//       'exp://',                         // Expo apps
//     ];

//     // Check if the origin is allowed
//     if (process.env.NODE_ENV === 'development') {
//       // In development, allow any localhost origin
//       if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('exp://'))) {
//         return callback(null, true);
//       }
//     } else {
//       // In production, only allow specific origins
//       if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) {
//         return callback(null, true);
//       }
//     }

//     callback(new Error('Not allowed by CORS'));
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
//   exposedHeaders: ['Content-Length', 'X-Request-ID'],
//   maxAge: 86400, // 24 hours
//   optionsSuccessStatus: 200
// };

// app.use(cors(corsOptions));

// // Handle preflight requests
// app.options('*', cors(corsOptions));

// // Body parser middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: config.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
//   max: config.RATE_LIMIT_MAX_REQUESTS || 100,
//   message: JSON.stringify({
//     success: false,
//     message: 'Too many requests from this IP, please try again later.',
//     retryAfter: '15 minutes'
//   }),
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) => {
//     // Skip rate limiting for health checks in development
//     if (process.env.NODE_ENV === 'development' && req.path === '/api/health') {
//       return true;
//     }
//     return false;
//   }
// });

// app.use('/api/', limiter);

// // Logging middleware
// if (config.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// } else {
//   app.use(morgan('combined'));
// }

// // Request logging middleware (custom)
// app.use((req, res, next) => {
//   const start = Date.now();
  
//   res.on('finish', () => {
//     const duration = Date.now() - start;
//     console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
//   });
  
//   next();
// });

// // Root route
// app.get('/', (req, res) => {
//   res.json({
//     message: 'MIGO Backend API',
//     version: '1.0.0',
//     documentation: '/api/health',
//     status: 'operational',
//     timestamp: new Date().toISOString(),
//     endpoints: {
//       auth: '/api/auth',
//       users: '/api/users',
//       events: '/api/events',
//       health: '/api/health'
//     }
//   });
// });

// // Mount the new API router
// app.use('/api', apiRouter);

// // 404 handler - MUST be after all routes
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'Not Found',
//     message: `Cannot ${req.method} ${req.path}`,
//     timestamp: new Date().toISOString(),
//     suggestedEndpoints: ['/api/health', '/api/auth/login', '/api/users/profile']
//   });
// });

// // Global error handler - MUST be last middleware
// app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
//   console.error('Global error handler:', {
//     message: err.message,
//     stack: err.stack,
//     path: req.path,
//     method: req.method,
//     ip: req.ip,
//     timestamp: new Date().toISOString()
//   });

//   const statusCode = err.name === 'ValidationError' ? 400 : 
//                      err.name === 'UnauthorizedError' ? 401 : 
//                      err.name === 'ForbiddenError' ? 403 : 
//                      err.name === 'NotFoundError' ? 404 : 500;

//   res.status(statusCode).json({
//     success: false,
//     error: err.name || 'InternalServerError',
//     message: config.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
//     ...(config.NODE_ENV === 'development' && { stack: err.stack }),
//     timestamp: new Date().toISOString()
//   });
// });

// const PORT = config.PORT || 5000;

// // Create HTTP server for WebSocket support
// const httpServer = createServer(app);

// // Initialize Socket.io for real-time features
// const io = new Server(httpServer, {
//   cors: {
//     origin: config.NODE_ENV === 'development' 
//       ? ['http://localhost:3000', 'http://localhost:19006', 'exp://*']
//       : config.CLIENT_URL ? [config.CLIENT_URL] : [],
//     credentials: true,
//     methods: ['GET', 'POST']
//   },
//   transports: ['websocket', 'polling'],
//   pingTimeout: 60000,
//   pingInterval: 25000
// });

// // Socket.io event handling
// io.on('connection', (socket) => {
//   console.log(`New client connected: ${socket.id}`);
  
//   // Join user to their room for private messages
//   socket.on('join-user-room', (userId: string) => {
//     socket.join(`user:${userId}`);
//     console.log(`User ${userId} joined their room`);
//   });
  
//   // Join event room
//   socket.on('join-event-room', (eventId: string) => {
//     socket.join(`event:${eventId}`);
//     console.log(`Socket ${socket.id} joined event room ${eventId}`);
//   });
  
//   // Handle chat messages
//   socket.on('chat-message', (data: { room: string; message: string; sender: string }) => {
//     io.to(data.room).emit('new-message', {
//       ...data,
//       timestamp: new Date().toISOString()
//     });
//   });
  
//   // Handle notifications
//   socket.on('send-notification', (data: { userId: string; notification: any }) => {
//     io.to(`user:${data.userId}`).emit('notification', data.notification);
//   });
  
//   socket.on('disconnect', (reason) => {
//     console.log(`Client disconnected: ${socket.id} (reason: ${reason})`);
//   });
  
//   socket.on('error', (error) => {
//     console.error(`Socket error for ${socket.id}:`, error);
//   });
// });

// // Start the server
// httpServer.listen(PORT, '0.0.0.0', () => {
//   console.log(`
// ╔══════════════════════════════════════════════════════════════╗
// ║                    MIGO BACKEND SERVER                       ║
// ╠══════════════════════════════════════════════════════════════╣
// ║                                                              ║
// ║  🚀  Server is running!                                      ║
// ║                                                              ║
// ║  📝  Environment: ${config.NODE_ENV}${' '.repeat(33 - config.NODE_ENV.length)}║
// ║  🌐  URL: http://localhost:${PORT}${' '.repeat(39 - PORT.toString().length)}║
// ║  📡  WebSocket: ws://localhost:${PORT}${' '.repeat(38 - PORT.toString().length)}║
// ║                                                              ║
// ║  📊  API Endpoints:                                          ║
// ║     • Health:    http://localhost:${PORT}/api/health${' '.repeat(33 - PORT.toString().length)}║
// ║     • Auth:      http://localhost:${PORT}/api/auth${' '.repeat(34 - PORT.toString().length)}║
// ║     • Users:     http://localhost:${PORT}/api/users${' '.repeat(34 - PORT.toString().length)}║
// ║                                                              ║
// ║  ⚙️   Configuration Status:                                  ║
// ║     • Database:  ${config.DATABASE_URL ? '✓ Connected' : '✗ Missing'}${' '.repeat(40 - (config.DATABASE_URL ? 10 : 8))}║
// ║     • JWT Secret: ${config.JWT_SECRET ? '✓ Set' : '✗ Missing'}${' '.repeat(41 - (config.JWT_SECRET ? 6 : 8))}║
// ║     • Redis:     ${config.REDIS_URL ? '✓ Connected' : '⚠️ Optional'}${' '.repeat(40 - (config.REDIS_URL ? 10 : 11))}║
// ║                                                              ║
// ║  💡  Development Tips:                                       ║
// ║     1. Run 'npx prisma migrate dev' to setup database       ║
// ║     2. Check .env file for missing variables                ║
// ║     3. Use '/api/health' to verify server status            ║
// ║                                                              ║
// ╚══════════════════════════════════════════════════════════════╝
//   `);
// });

// // Graceful shutdown
// const gracefulShutdown = () => {
//   console.log('\n🛑 Received shutdown signal, closing server gracefully...');
  
//   httpServer.close(() => {
//     console.log('👋 HTTP server closed');
    
//     // Close database connections
//     // Add your database cleanup here
    
//     console.log('✅ Graceful shutdown complete');
//     process.exit(0);
//   });

//   // Force shutdown after 10 seconds
//   setTimeout(() => {
//     console.error('⏰ Forcing shutdown after timeout');
//     process.exit(1);
//   }, 10000);
// };

// process.on('SIGTERM', gracefulShutdown);
// process.on('SIGINT', gracefulShutdown);

// // Handle uncaught errors
// process.on('uncaughtException', (error) => {
//   console.error('💥 Uncaught Exception:', error);
//   // Don't exit in development to allow debugging
//   if (process.env.NODE_ENV === 'production') {
//     process.exit(1);
//   }
// });

// process.on('unhandledRejection', (reason, promise) => {
//   console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
// });

// export { io }; // Export io for use in other modules
// export default app;

// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Migo Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    data: {
      project: 'Migo Event Finder',
      version: '1.0.0',
      features: ['Event Discovery', 'User Auth', 'Bookings']
    }
  });
});



// User test endpoint
app.post('/api/users/test-login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication
  if (email && password) {
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: 'test-user-123',
        email: email,
        name: 'Test User',
        token: 'mock-jwt-token-for-testing'
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email and password required'
    });
  }
});

// Event test endpoint
app.get('/api/events', (req, res) => {
  const mockEvents = [
    {
      id: '1',
      title: 'Music Festival 2024',
      description: 'Annual music festival',
      date: '2024-12-15T18:00:00Z',
      location: { city: 'New York', venue: 'Central Park' },
      price: 50
    },
    {
      id: '2',
      title: 'Tech Conference',
      description: 'Tech innovation conference',
      date: '2024-11-20T09:00:00Z',
      location: { city: 'San Francisco', venue: 'Moscone Center' },
      price: 299
    }
  ];
  
  res.json({
    success: true,
    events: mockEvents,
    count: mockEvents.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Test endpoint: http://localhost:${PORT}/api/test`);
});