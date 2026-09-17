/**
 * Event validation schemas
 * Migrated from apps/backend/src/api/events/validation.ts
 */
import { z } from 'zod';
import {
  EVENT_TITLE_MIN_LENGTH,
  EVENT_TITLE_MAX_LENGTH,
  EVENT_SHORT_DESCRIPTION_MAX_LENGTH,
  LATITUDE_MIN,
  LATITUDE_MAX,
  LONGITUDE_MIN,
  LONGITUDE_MAX,
  CURRENCY_CODE_LENGTH,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  DEFAULT_SEARCH_RADIUS,
} from '../constants';

// Event categories enum
export const EventCategoryEnum = z.enum([
  'MUSIC',
  'SPORTS',
  'ARTS',
  'FOOD',
  'TECH',
  'BUSINESS',
  'EDUCATION',
  'OTHER',
]);

// Create event schema
export const createEventSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(EVENT_TITLE_MIN_LENGTH, `Title must be at least ${EVENT_TITLE_MIN_LENGTH} characters`)
      .max(EVENT_TITLE_MAX_LENGTH),
    description: z.string().optional(),
    shortDescription: z.string().max(EVENT_SHORT_DESCRIPTION_MAX_LENGTH).optional(),
    category: z.string().min(2, 'Category is required'),
    subcategory: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    startDate: z.string().datetime('Invalid date format'),
    endDate: z.string().datetime('Invalid date format').optional(),
    venueName: z.string().min(2, 'Venue name is required'),
    address: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    country: z.string().min(2, 'Country is required'),
    latitude: z.number().min(LATITUDE_MIN).max(LATITUDE_MAX).optional(),
    longitude: z.number().min(LONGITUDE_MIN).max(LONGITUDE_MAX).optional(),
    locationType: z.enum(['VENUE', 'ONLINE', 'HYBRID']).default('VENUE'),
    onlineUrl: z.string().url().optional(),
    priceFrom: z.number().min(0, 'Price cannot be negative').optional(),
    priceTo: z.number().min(0, 'Price cannot be negative').optional(),
    currency: z
      .string()
      .length(CURRENCY_CODE_LENGTH, `Currency must be ${CURRENCY_CODE_LENGTH} characters`)
      .default('USD'),
    isFree: z.boolean().default(false),
    ticketUrl: z.string().url().optional(),
    bookingType: z.enum(['FREE', 'PAID', 'DONATION', 'RSVP']).default('PAID'),
    capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
    coverImage: z.string().url('Invalid image URL').optional(),
    images: z.array(z.string().url()).optional().default([]),
    gallery: z.array(z.string().url()).optional().default([]),
    isPetFriendly: z.boolean().default(false),
    isWheelchairAccessible: z.boolean().default(false),
    hasParking: z.boolean().default(false),
    hasFood: z.boolean().default(false),
    hasDrinks: z.boolean().default(false),
    hasWiFi: z.boolean().default(false),
    facilities: z.array(z.string()).optional().default([]),
    dressCode: z.string().optional(),
    ageRestriction: z.number().min(0).optional(),
    ageGroup: z.string().optional(),
    visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).default('PUBLIC'),
    isFeatured: z.boolean().default(false),
    externalUrl: z.string().url().optional(),
    organizerEmail: z.string().email().optional(),
    organizerPhone: z.string().optional(),
    supportEmail: z.string().email().optional(),
    supportPhone: z.string().optional(),
    website: z.string().url().optional(),
    socialLinks: z.record(z.string(), z.string()).optional().default({}),
  }),
});

// Update event schema
export const updateEventSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Event ID is required'),
  }),
  body: createEventSchema.shape.body.partial(),
});

// Event query schema for filtering
export const eventQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => parseInt(val || String(DEFAULT_PAGE)))
      .refine((n) => n >= 1, 'Page must be at least 1'),
    limit: z
      .string()
      .optional()
      .transform((val) => parseInt(val || String(DEFAULT_LIMIT)))
      .refine((n) => n >= 1 && n <= MAX_LIMIT, `Limit must be between 1 and ${MAX_LIMIT}`),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    priceMin: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((n) => n === undefined || n >= 0, 'Min price cannot be negative'),
    priceMax: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((n) => n === undefined || n >= 0, 'Max price cannot be negative'),
    isFree: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    isFeatured: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    isPetFriendly: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    tags: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(',') : [])),
    search: z.string().optional(),
    lat: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    lng: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    radius: z
      .string()
      .optional()
      .transform((val) => parseFloat(val || String(DEFAULT_SEARCH_RADIUS))),
    sortBy: z.enum(['date', 'price', 'popularity', 'distance', 'rating']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    userId: z.string().optional(),
  }),
});

// Event ID schema
export const eventIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Event ID is required'),
  }),
});

// Search events schema
export const searchEventsSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    page: z
      .string()
      .optional()
      .transform((val) => parseInt(val || String(DEFAULT_PAGE))),
    limit: z
      .string()
      .optional()
      .transform((val) => parseInt(val || String(DEFAULT_LIMIT))),
  }),
});

// Type exports
export type CreateEventInput = z.infer<typeof createEventSchema>['body'];
export type UpdateEventInput = z.infer<typeof updateEventSchema>['body'];
export type EventQueryInput = z.infer<typeof eventQuerySchema>['query'];
export type SearchEventsInput = z.infer<typeof searchEventsSchema>['query'];
