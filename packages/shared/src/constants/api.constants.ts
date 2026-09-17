/**
 * API-related constants for HTTP, pagination, and general API behavior
 */

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const MIN_PAGE = 1;
export const MIN_LIMIT = 1;

// HTTP Status Codes
export const HTTP_STATUS = {
  // Success codes
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Redirection codes
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // Client error codes
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server error codes
  INTERNAL_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Currency codes
export const DEFAULT_CURRENCY = 'USD';
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// Social auth providers
export const AUTH_PROVIDERS = ['google', 'apple', 'facebook'] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

// User roles
export const USER_ROLES = ['USER', 'ORGANIZER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Booking status
export const BOOKING_STATUS = ['PENDING', 'CONFIRMED', 'CANCELLED', 'ATTENDED'] as const;
export type BookingStatus = (typeof BOOKING_STATUS)[number];

// Payment methods
export const PAYMENT_METHODS = ['CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'PAYPAL'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
