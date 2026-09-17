/**
 * Authentication validation schemas
 * Migrated from apps/backend/src/api/auth/validation.ts
 */
import { z } from 'zod';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_MESSAGES,
  PHONE_MIN_LENGTH,
  PHONE_REGEX,
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_REGEX,
  NAME_MIN_LENGTH,
} from '../constants';

// Register schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, PASSWORD_MESSAGES.MIN_LENGTH)
    .regex(PASSWORD_REGEX.UPPERCASE, PASSWORD_MESSAGES.UPPERCASE)
    .regex(PASSWORD_REGEX.LOWERCASE, PASSWORD_MESSAGES.LOWERCASE)
    .regex(PASSWORD_REGEX.NUMBER, PASSWORD_MESSAGES.NUMBER),
  name: z.string().min(NAME_MIN_LENGTH, `Name must be at least ${NAME_MIN_LENGTH} characters`),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Phone verification schema
export const phoneVerificationSchema = z.object({
  phone: z
    .string()
    .min(PHONE_MIN_LENGTH, `Phone number must be at least ${PHONE_MIN_LENGTH} digits`)
    .regex(PHONE_REGEX, 'Invalid phone number format'),
});

// Verify phone schema
export const verifyPhoneSchema = z.object({
  phone: z.string().min(PHONE_MIN_LENGTH, 'Phone number is required'),
  code: z
    .string()
    .length(
      VERIFICATION_CODE_LENGTH,
      `Verification code must be ${VERIFICATION_CODE_LENGTH} digits`
    )
    .regex(VERIFICATION_CODE_REGEX, 'Verification code must contain only numbers'),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Change password schema
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `New password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .regex(PASSWORD_REGEX.UPPERCASE, 'New password must contain at least one uppercase letter')
    .regex(PASSWORD_REGEX.LOWERCASE, 'New password must contain at least one lowercase letter')
    .regex(PASSWORD_REGEX.NUMBER, 'New password must contain at least one number'),
});

// Reset password schema
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, PASSWORD_MESSAGES.MIN_LENGTH)
      .regex(PASSWORD_REGEX.UPPERCASE, PASSWORD_MESSAGES.UPPERCASE)
      .regex(PASSWORD_REGEX.LOWERCASE, PASSWORD_MESSAGES.LOWERCASE)
      .regex(PASSWORD_REGEX.NUMBER, PASSWORD_MESSAGES.NUMBER),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Social login schema
export const socialLoginSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
  provider: z.enum(['google', 'apple', 'facebook']),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PhoneVerificationInput = z.infer<typeof phoneVerificationSchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SocialLoginInput = z.infer<typeof socialLoginSchema>;
