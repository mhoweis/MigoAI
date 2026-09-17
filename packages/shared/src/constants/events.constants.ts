/**
 * Event-related constants shared across backend and mobile
 */

// Event categories matching Prisma schema
export const EVENT_CATEGORIES = [
  'MUSIC',
  'SPORTS',
  'ARTS',
  'FOOD',
  'TECH',
  'BUSINESS',
  'EDUCATION',
  'OTHER',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

// Event category labels for UI
export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  MUSIC: 'Music',
  SPORTS: 'Sports',
  ARTS: 'Arts & Culture',
  FOOD: 'Food & Drink',
  TECH: 'Technology',
  BUSINESS: 'Business',
  EDUCATION: 'Education',
  OTHER: 'Other',
};

// Booking types
export const BOOKING_TYPES = ['FREE', 'PAID', 'DONATION', 'RSVP'] as const;
export type BookingType = (typeof BOOKING_TYPES)[number];

// Location types
export const LOCATION_TYPES = ['VENUE', 'ONLINE', 'HYBRID'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

// Event status
export const EVENT_STATUS = ['DRAFT', 'PENDING', 'ACTIVE', 'CANCELLED', 'ARCHIVED'] as const;
export type EventStatus = (typeof EVENT_STATUS)[number];

// Event visibility
export const EVENT_VISIBILITY = ['PUBLIC', 'UNLISTED', 'PRIVATE'] as const;
export type EventVisibility = (typeof EVENT_VISIBILITY)[number];

// Sort options
export const EVENT_SORT_OPTIONS = ['date', 'price', 'popularity', 'distance', 'rating'] as const;
export type EventSortOption = (typeof EVENT_SORT_OPTIONS)[number];

// Sort order
export const SORT_ORDER = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDER)[number];

// Default radius for location-based search (in km)
export const DEFAULT_SEARCH_RADIUS = 10;
