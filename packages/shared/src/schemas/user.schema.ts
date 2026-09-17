/**
 * User validation schemas
 * Migrated from apps/backend/src/api/users/validation.ts
 */
import { z } from 'zod';
import {
  NAME_MIN_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  BIO_MAX_LENGTH,
  LATITUDE_MIN,
  LATITUDE_MAX,
  LONGITUDE_MIN,
  LONGITUDE_MAX,
} from '../constants';

// Update profile schema
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(NAME_MIN_LENGTH, 'Name is required').optional(),
    displayName: z
      .string()
      .min(DISPLAY_NAME_MIN_LENGTH, `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters`)
      .optional(),
    bio: z.string().max(BIO_MAX_LENGTH, `Bio cannot exceed ${BIO_MAX_LENGTH} characters`).optional(),
    avatarUrl: z.string().url('Invalid URL').optional(),
    website: z.string().url('Invalid URL').optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
  }),
});

// Update location schema
export const updateLocationSchema = z.object({
  body: z.object({
    latitude: z
      .number()
      .min(LATITUDE_MIN)
      .max(LATITUDE_MAX, `Latitude must be between ${LATITUDE_MIN} and ${LATITUDE_MAX}`)
      .optional(),
    longitude: z
      .number()
      .min(LONGITUDE_MIN)
      .max(LONGITUDE_MAX, `Longitude must be between ${LONGITUDE_MIN} and ${LONGITUDE_MAX}`)
      .optional(),
    city: z.string().min(1, 'City is required').optional(),
    country: z.string().min(1, 'Country is required').optional(),
  }),
});

// Update preferences schema
export const updatePreferencesSchema = z.object({
  body: z.object({
    interests: z.array(z.string()).optional(),
    preferences: z.record(z.string(), z.any()).optional(),
    settings: z.record(z.string(), z.any()).optional(),
  }),
});

// Update profile picture schema
export const updateProfilePictureSchema = z.object({
  body: z.object({
    imageUrl: z.string().url('Invalid image URL'),
  }),
});

// Type exports
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>['body'];
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>['body'];
export type UpdateProfilePictureInput = z.infer<typeof updateProfilePictureSchema>['body'];
