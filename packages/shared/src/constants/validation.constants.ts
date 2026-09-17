/**
 * Validation constraints used across backend and mobile
 */

// Password validation
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = {
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  NUMBER: /[0-9]/,
} as const;

export const PASSWORD_MESSAGES = {
  MIN_LENGTH: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  UPPERCASE: 'Password must contain at least one uppercase letter',
  LOWERCASE: 'Password must contain at least one lowercase letter',
  NUMBER: 'Password must contain at least one number',
} as const;

// User validation
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 255;
export const DISPLAY_NAME_MIN_LENGTH = 2;
export const BIO_MAX_LENGTH = 1000;

// Event validation
export const EVENT_TITLE_MIN_LENGTH = 3;
export const EVENT_TITLE_MAX_LENGTH = 255;
export const EVENT_SHORT_DESCRIPTION_MAX_LENGTH = 500;
export const EVENT_DESCRIPTION_MAX_LENGTH = 10000;
export const REVIEW_TITLE_MAX_LENGTH = 200;
export const REVIEW_COMMENT_MAX_LENGTH = 1000;

// Phone validation
export const PHONE_MIN_LENGTH = 10;
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

// Verification code
export const VERIFICATION_CODE_LENGTH = 6;
export const VERIFICATION_CODE_REGEX = /^\d+$/;

// Geo coordinates
export const LATITUDE_MIN = -90;
export const LATITUDE_MAX = 90;
export const LONGITUDE_MIN = -180;
export const LONGITUDE_MAX = 180;

// Currency
export const CURRENCY_CODE_LENGTH = 3;

// Rating
export const RATING_MIN = 1;
export const RATING_MAX = 5;
