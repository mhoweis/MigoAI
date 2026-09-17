// src/config/env.ts - UPDATED VERSION
import { z } from 'zod';

// Environment schema with sensible defaults
const envSchema = z.object({
  // Required
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  
  // Optional with defaults
  COOKIE_SECRET: z.string().default('dev-cookie-secret'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Optional APIs
  GEMINI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Event Data APIs
  TICKETMASTER_API_KEY: z.string().optional(),
  EVENTBRITE_API_KEY: z.string().optional(),
  PREDICTHQ_ACCESS_TOKEN: z.string().optional(),
  PLATINUMLIST_API_KEY: z.string().optional(),
  MEETUP_API_KEY: z.string().optional(),

  // Location APIs
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  MAPBOX_ACCESS_TOKEN: z.string().optional(),

  // Optional services
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().optional(),
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
});

// Parse and export
const env = envSchema.parse(process.env);

// Helper function to get app URL
const getAppUrl = () => {
  const port = parseInt(env.PORT, 10);
  return `http://localhost:${port}`;
};

export default {
  // Application
  NODE_ENV: env.NODE_ENV,
  PORT: parseInt(env.PORT, 10),
  APP_URL: getAppUrl(),
  CLIENT_URL: env.CLIENT_URL,
  
  // Database
  DATABASE_URL: env.DATABASE_URL,
  
  // Authentication
  JWT_SECRET: env.JWT_SECRET,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  COOKIE_SECRET: env.COOKIE_SECRET,
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: env.RATE_LIMIT_MAX_REQUESTS,
  
  // Redis
  REDIS_URL: env.REDIS_URL,
  
  // APIs
  GEMINI_API_KEY: env.GEMINI_API_KEY || '',
  STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY || '',

  // Event Data APIs
  TICKETMASTER_API_KEY: env.TICKETMASTER_API_KEY || '',
  EVENTBRITE_API_KEY: env.EVENTBRITE_API_KEY || '',
  PREDICTHQ_ACCESS_TOKEN: env.PREDICTHQ_ACCESS_TOKEN || '',
  PLATINUMLIST_API_KEY: env.PLATINUMLIST_API_KEY || '',
  MEETUP_API_KEY: env.MEETUP_API_KEY || '',

  // Location APIs
  GOOGLE_MAPS_API_KEY: env.GOOGLE_MAPS_API_KEY || '',
  MAPBOX_ACCESS_TOKEN: env.MAPBOX_ACCESS_TOKEN || '',
  
  // Optional services
  FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: env.FIREBASE_PRIVATE_KEY || '',
  TWILIO_ACCOUNT_SID: env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: env.TWILIO_PHONE_NUMBER || '',
  SENDGRID_API_KEY: env.SENDGRID_API_KEY || '',
  FROM_EMAIL: env.FROM_EMAIL || 'noreply@migo-events.com',
  EMAIL_SERVER_HOST: env.EMAIL_SERVER_HOST || '',
  EMAIL_SERVER_PORT: env.EMAIL_SERVER_PORT || '',
  EMAIL_SERVER_USER: env.EMAIL_SERVER_USER || '',
  EMAIL_SERVER_PASSWORD: env.EMAIL_SERVER_PASSWORD || '',
  
  // Helpers
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
};