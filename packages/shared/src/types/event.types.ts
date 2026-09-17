/**
 * Event types
 * Merged from apps/backend and apps/mobile event types
 */
import { EventCategory, BookingType, LocationType, EventStatus, EventVisibility } from '../constants';
import { SocialLinks } from './common.types';

export interface Event {
  id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  category: EventCategory | string;
  subcategory?: string;
  tags: string[];

  // Dates
  startDate: string;
  endDate?: string;
  timezone?: string;

  // Location
  venueName: string;
  address?: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  locationType: LocationType;
  onlineUrl?: string;

  // Pricing
  priceFrom?: number;
  priceTo?: number;
  currency: string;
  isFree: boolean;
  bookingType: BookingType;

  // Capacity
  capacity?: number;
  availableTickets?: number;

  // Media
  coverImage?: string;
  thumbnail?: string;
  images?: string[];
  gallery?: string[];
  videoUrl?: string;

  // Features
  isPetFriendly: boolean;
  isWheelchairAccessible: boolean;
  hasParking: boolean;
  hasFood: boolean;
  hasDrinks: boolean;
  hasWiFi: boolean;
  facilities?: string[];
  dressCode?: string;
  ageRestriction?: number;
  ageGroup?: string;

  // Status & visibility
  status: EventStatus;
  visibility: EventVisibility;
  isFeatured: boolean;
  isSponsored?: boolean;

  // External
  externalId?: string;
  externalSource?: string;
  externalUrl?: string;
  ticketUrl?: string;

  // Contact
  organizerEmail?: string;
  organizerPhone?: string;
  supportEmail?: string;
  supportPhone?: string;
  website?: string;
  socialLinks?: SocialLinks;

  // Relations
  organizerId: string;
  organizer?: {
    id: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
    email?: string;
  };

  // Stats
  viewCount?: number;
  wishlistCount?: number;
  shareCount?: number;
  averageRating?: number;
  reviewCount?: number;

  // User-specific (for frontend)
  isBookmarked?: boolean;
  userBooking?: {
    id: string;
    status: string;
    ticketCount: number;
  };

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface EventFilters {
  category?: string;
  subcategory?: string;
  city?: string;
  country?: string;
  dateFrom?: string;
  dateTo?: string;
  priceMin?: number;
  priceMax?: number;
  isFree?: boolean;
  isFeatured?: boolean;
  isPetFriendly?: boolean;
  tags?: string[];
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  sortBy?: 'date' | 'price' | 'popularity' | 'distance' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface EventSummary {
  id: string;
  title: string;
  category: string;
  startDate: string;
  city: string;
  priceFrom?: number;
  isFree: boolean;
  coverImage?: string;
  isFeatured: boolean;
}
