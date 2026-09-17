// src/services/mockData.ts
import { Event } from '@migo/shared';

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Jazz Night Live',
    description: 'An evening of smooth jazz with local artists performing classic and contemporary jazz pieces.',
    category: 'MUSIC',
    tags: ['Jazz', 'Live Music', 'Nightlife'],

    // Date & Time
    startDate: '2024-12-15T19:00:00Z',
    endDate: '2024-12-15T23:00:00Z',

    // Location
    venueName: 'Downtown Jazz Club',
    city: 'New York',
    country: 'USA',
    locationType: 'VENUE',

    // Pricing
    priceFrom: 45,
    priceTo: 45,
    currency: 'USD',
    isFree: false,
    bookingType: 'PAID',

    // Capacity
    capacity: 200,
    availableTickets: 45,

    // Media
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
    images: ['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4'],

    // Features
    isPetFriendly: false,
    isWheelchairAccessible: true,
    hasParking: true,
    hasFood: true,
    hasDrinks: true,
    hasWiFi: false,

    // Status
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    isFeatured: true,

    // Organizer
    organizerId: 'org1',
    organizer: {
      id: 'org1',
      name: 'NYC Jazz Society',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
    },

    // User-specific
    isBookmarked: true,

    // Timestamps
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: '2024-11-01T10:00:00Z'
  },
  {
    id: '2',
    title: 'Tech Conference 2024',
    description: 'Annual technology conference with industry leaders discussing AI, blockchain, and future tech trends.',
    category: 'TECH',
    tags: ['AI', 'Technology', 'Conference'],

    // Date & Time
    startDate: '2024-12-20T09:00:00Z',
    endDate: '2024-12-20T18:00:00Z',

    // Location
    venueName: 'Convention Center',
    city: 'San Francisco',
    country: 'USA',
    locationType: 'VENUE',

    // Pricing
    priceFrom: 299,
    priceTo: 299,
    currency: 'USD',
    isFree: false,
    bookingType: 'PAID',

    // Capacity
    capacity: 1000,
    availableTickets: 250,

    // Media
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    images: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87'],

    // Features
    isPetFriendly: false,
    isWheelchairAccessible: true,
    hasParking: true,
    hasFood: true,
    hasDrinks: true,
    hasWiFi: true,

    // Status
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    isFeatured: true,

    // Organizer
    organizerId: 'org2',
    organizer: {
      id: 'org2',
      name: 'Tech Future Inc.',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
    },

    // User-specific
    isBookmarked: false,

    // Timestamps
    createdAt: '2024-10-15T10:00:00Z',
    updatedAt: '2024-10-15T10:00:00Z'
  },
  {
    id: '3',
    title: 'Yoga & Wellness Retreat',
    description: 'A full day of yoga, meditation, and wellness workshops in a serene natural setting.',
    category: 'EDUCATION',
    tags: ['Yoga', 'Wellness', 'Meditation'],

    // Date & Time
    startDate: '2024-12-18T08:00:00Z',
    endDate: '2024-12-18T17:00:00Z',

    // Location
    venueName: 'Serenity Park',
    city: 'Los Angeles',
    country: 'USA',
    locationType: 'VENUE',

    // Pricing
    priceFrom: 85,
    priceTo: 85,
    currency: 'USD',
    isFree: false,
    bookingType: 'PAID',

    // Capacity
    capacity: 100,
    availableTickets: 20,

    // Media
    coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b'],

    // Features
    isPetFriendly: false,
    isWheelchairAccessible: true,
    hasParking: true,
    hasFood: true,
    hasDrinks: false,
    hasWiFi: false,

    // Status
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    isFeatured: true,

    // Organizer
    organizerId: 'org3',
    organizer: {
      id: 'org3',
      name: 'Mindful Living',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'
    },

    // User-specific
    isBookmarked: true,

    // Timestamps
    createdAt: '2024-11-10T10:00:00Z',
    updatedAt: '2024-11-10T10:00:00Z'
  },
];

export const todayEvents = mockEvents.filter((_, index) => index < 3);
export const thisWeekEvents = mockEvents.filter((_, index) => index < 5);
export const topUpcomingEvents = mockEvents.slice(0, 10);
