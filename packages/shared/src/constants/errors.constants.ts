/**
 * Error codes and messages for standardized error handling
 */

// Error codes enum
export enum ErrorCode {
  // Authentication errors (1xxx)
  UNAUTHORIZED = 'AUTH_001',
  INVALID_CREDENTIALS = 'AUTH_002',
  TOKEN_EXPIRED = 'AUTH_003',
  TOKEN_INVALID = 'AUTH_004',
  FORBIDDEN = 'AUTH_005',
  EMAIL_ALREADY_EXISTS = 'AUTH_006',
  PHONE_ALREADY_EXISTS = 'AUTH_007',
  ACCOUNT_LOCKED = 'AUTH_008',
  EMAIL_NOT_VERIFIED = 'AUTH_009',

  // Validation errors (2xxx)
  VALIDATION_ERROR = 'VAL_001',
  INVALID_INPUT = 'VAL_002',
  MISSING_REQUIRED_FIELD = 'VAL_003',
  INVALID_EMAIL_FORMAT = 'VAL_004',
  INVALID_PHONE_FORMAT = 'VAL_005',
  INVALID_DATE_FORMAT = 'VAL_006',
  INVALID_URL_FORMAT = 'VAL_007',

  // Resource errors (3xxx)
  NOT_FOUND = 'RES_001',
  ALREADY_EXISTS = 'RES_002',
  RESOURCE_CONFLICT = 'RES_003',
  EVENT_NOT_FOUND = 'RES_004',
  USER_NOT_FOUND = 'RES_005',
  BOOKING_NOT_FOUND = 'RES_006',

  // Business logic errors (4xxx)
  EVENT_SOLD_OUT = 'BIZ_001',
  EVENT_NOT_ACTIVE = 'BIZ_002',
  BOOKING_ALREADY_EXISTS = 'BIZ_003',
  INSUFFICIENT_TICKETS = 'BIZ_004',
  EVENT_PAST_DATE = 'BIZ_005',
  BOOKING_CANCELLED = 'BIZ_006',
  PAYMENT_FAILED = 'BIZ_007',
  REFUND_NOT_ALLOWED = 'BIZ_008',

  // Server errors (5xxx)
  INTERNAL_ERROR = 'SRV_001',
  DATABASE_ERROR = 'SRV_002',
  EXTERNAL_SERVICE_ERROR = 'SRV_003',
  FILE_UPLOAD_ERROR = 'SRV_004',
  EMAIL_SEND_ERROR = 'SRV_005',
  SMS_SEND_ERROR = 'SRV_006',
  AI_SERVICE_ERROR = 'SRV_007',
  PAYMENT_GATEWAY_ERROR = 'SRV_008',

  // Rate limiting (6xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_001',
}

// Error messages mapping
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Auth errors
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please login again',
  [ErrorCode.TOKEN_INVALID]: 'Invalid authentication token',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'An account with this email already exists',
  [ErrorCode.PHONE_ALREADY_EXISTS]: 'An account with this phone number already exists',
  [ErrorCode.ACCOUNT_LOCKED]: 'Your account has been locked. Please contact support',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email address',

  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCode.INVALID_EMAIL_FORMAT]: 'Invalid email format',
  [ErrorCode.INVALID_PHONE_FORMAT]: 'Invalid phone number format',
  [ErrorCode.INVALID_DATE_FORMAT]: 'Invalid date format',
  [ErrorCode.INVALID_URL_FORMAT]: 'Invalid URL format',

  // Resource errors
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.ALREADY_EXISTS]: 'Resource already exists',
  [ErrorCode.RESOURCE_CONFLICT]: 'Resource conflict detected',
  [ErrorCode.EVENT_NOT_FOUND]: 'Event not found',
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.BOOKING_NOT_FOUND]: 'Booking not found',

  // Business logic errors
  [ErrorCode.EVENT_SOLD_OUT]: 'This event is sold out',
  [ErrorCode.EVENT_NOT_ACTIVE]: 'This event is not currently active',
  [ErrorCode.BOOKING_ALREADY_EXISTS]: 'You have already booked this event',
  [ErrorCode.INSUFFICIENT_TICKETS]: 'Not enough tickets available',
  [ErrorCode.EVENT_PAST_DATE]: 'Cannot book past events',
  [ErrorCode.BOOKING_CANCELLED]: 'This booking has been cancelled',
  [ErrorCode.PAYMENT_FAILED]: 'Payment processing failed',
  [ErrorCode.REFUND_NOT_ALLOWED]: 'Refund is not allowed for this booking',

  // Server errors
  [ErrorCode.INTERNAL_ERROR]: 'An internal server error occurred',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service is currently unavailable',
  [ErrorCode.FILE_UPLOAD_ERROR]: 'File upload failed',
  [ErrorCode.EMAIL_SEND_ERROR]: 'Failed to send email',
  [ErrorCode.SMS_SEND_ERROR]: 'Failed to send SMS',
  [ErrorCode.AI_SERVICE_ERROR]: 'AI service is currently unavailable',
  [ErrorCode.PAYMENT_GATEWAY_ERROR]: 'Payment gateway error',

  // Rate limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later',
};
