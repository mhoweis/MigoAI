import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import config from '../config/env';

export interface EventFilters {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  city?: string;
  country?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  priceMin?: number;
  priceMax?: number;
  isFree?: boolean;
  isFeatured?: boolean;
  isPetFriendly?: boolean;
  tags?: string[];
  search?: string;
  sortBy?: 'date' | 'price' | 'popularity' | 'distance' | 'rating';
  sortOrder?: 'asc' | 'desc';
  radius?: number;
  lat?: number;
  lng?: number;
  userId?: string;
}

// Helper function to normalize dates
const normalizeDate = (date: Date | string | undefined): Date | undefined => {
  if (!date) return undefined;
  if (date instanceof Date) return date;
  const d = new Date(date);
  return isNaN(d.getTime()) ? undefined : d;
};

export class EventService {
  async getEvents(filters: EventFilters): Promise<{
    events: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: EventFilters;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: Prisma.EventWhereInput = {
      status: 'ACTIVE',
      visibility: { in: ['PUBLIC', 'UNLISTED'] },
    };
    
    // Apply filters
    if (filters.category) {
      where.category = filters.category;
    }
    
    if (filters.subcategory) {
      where.subcategory = filters.subcategory;
    }
    
    if (filters.city) {
      where.city = filters.city;
    }
    
    if (filters.country) {
      where.country = filters.country;
    }
    
    // Normalize dates before using them
    const dateFrom = normalizeDate(filters.dateFrom);
    const dateTo = normalizeDate(filters.dateTo);
    
    if (dateFrom || dateTo) {
      where.startDate = {};
      if (dateFrom) where.startDate.gte = dateFrom;
      if (dateTo) where.startDate.lte = dateTo;
    }
    
    // Only apply price filter if explicitly requested (not default values)
    // Include events with NULL prices to show Ticketmaster events
    if (filters.isFree === true) {
      where.isFree = true;
    } else if ((filters.priceMin !== undefined && filters.priceMin > 0) || (filters.priceMax !== undefined && filters.priceMax < 1000)) {
      // Only filter by price if non-default values are provided
      where.OR = [
        { isFree: true },
        { priceFrom: null }, // Include events with no price set (Ticketmaster events)
        {
          AND: [
            filters.priceMin !== undefined && filters.priceMin > 0 ? { priceFrom: { gte: new Prisma.Decimal(filters.priceMin) } } : {},
            filters.priceMax !== undefined && filters.priceMax < 1000 ? { priceFrom: { lte: new Prisma.Decimal(filters.priceMax) } } : {},
          ]
        }
      ];
    }
    
    if (filters.isFree !== undefined) {
      where.isFree = filters.isFree;
    }
    
    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }
    
    if (filters.isPetFriendly !== undefined) {
      where.isPetFriendly = filters.isPetFriendly;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      where.OR = filters.tags.map(tag => ({
        tags: {
          path: '$',
          string_contains: tag
        }
      }));
    }
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { venueName: { contains: filters.search } },
      ];
    }
    
    // Handle location-based filtering
    if (filters.lat && filters.lng && filters.radius) {
      where.city = filters.city || 'Dubai';
    }
    
    // Determine sort order
    let orderBy: Prisma.EventOrderByWithRelationInput = {};
    switch (filters.sortBy) {
      case 'price':
        orderBy = { priceFrom: filters.sortOrder || 'asc' };
        break;
      case 'popularity':
        orderBy = { wishlistCount: filters.sortOrder || 'desc' };
        break;
      case 'rating':
        orderBy = { ratingAverage: filters.sortOrder || 'desc' };
        break;
      case 'distance':
        orderBy = { createdAt: 'desc' };
        break;
      case 'date':
      default:
        orderBy = { startDate: filters.sortOrder || 'asc' };
        break;
    }
    
    try {
      // Get total count
      const total = await prisma.event.count({ where });
      
      // Get events
      const events = await prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: this.getEventSelectFields(filters.userId),
      });
      
      // Log search if user is logged in
      if (filters.userId && filters.search) {
        await prisma.searchLog.create({
          data: {
            userId: filters.userId,
            query: filters.search,
            filters: filters as any,
            resultsCount: events.length,
            deviceType: 'web',
          }
        });
      }
      
      // Log views for each event
      if (filters.userId) {
        for (const event of events) {
          await prisma.eventView.create({
            data: {
              eventId: (event as any).id,
              userId: filters.userId!,
              source: 'search',
              deviceType: 'web',
            }
          });
        }
      }
      
      return {
        events: events.map(event => this.formatEventResponse(event, filters.userId)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        filters,
      };
    } catch (error) {
      console.error('Error fetching events:', error);
      // Return mock data for development
      return {
        events: this.getMockEvents().slice(0, limit),
        pagination: {
          page,
          limit,
          total: 50,
          totalPages: Math.ceil(50 / limit),
          hasNext: page * limit < 50,
          hasPrev: page > 1,
        },
        filters,
      };
    }
  }
  
  async getEventById(eventId: string, userId?: string): Promise<any> {
    try {
      // First try to find by ID, then by migoId (as string), then by slug
      const whereConditions: Prisma.EventWhereInput[] = [
        { id: eventId }
      ];
      
      const parsedMigoId = parseInt(eventId);
      if (!isNaN(parsedMigoId)) {
        whereConditions.push({ migoId: parsedMigoId.toString() }); // Convert to string
      }
      whereConditions.push({ slug: eventId });
      
      let event = await prisma.event.findFirst({
        where: {
          OR: whereConditions
        },
        select: this.getEventSelectFields(userId, true),
      });
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Cast event to any to access id property safely
      const eventWithId = event as any;
      
      // Log the view
      if (userId) {
        await prisma.eventView.create({
          data: {
            eventId: eventWithId.id,
            userId,
            source: 'direct',
            deviceType: 'web',
          }
        });
        
        // Increment view count
        await prisma.event.update({
          where: { id: eventWithId.id },
          data: { 
            views: { increment: 1 },
            uniqueViews: { increment: 1 },
          }
        });
      }
      
      // Get similar events
      const similarEvents = await this.getSimilarEvents(event);
      
      // Get organizer info
      const organizer = await prisma.user.findUnique({
        where: { id: eventWithId.organizerId },
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          isVerified: true,
          isOrganizer: true,
        }
      });
      
      // Get reviews
      const reviews = await prisma.review.findMany({
        where: { 
          eventId: eventWithId.id, 
          isFeatured: true 
        },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
      
      // Check if user has wishlisted this event
      let isWishlisted = false;
      if (userId) {
        const wishlist = await prisma.wishlist.findUnique({
          where: {
            userId_eventId: {
              userId,
              eventId: eventWithId.id,
            }
          }
        });
        isWishlisted = !!wishlist;
      }
      
      return {
        ...this.formatEventResponse(event, userId),
        organizer,
        similarEvents,
        reviews: reviews.map(review => ({
          id: review.id,
          rating: review.overallRating,
          title: review.title,
          comment: review.comment,
          isRecommended: review.isRecommended,
          createdAt: review.createdAt,
          user: (review as any).user, // Use type assertion
        })),
        isWishlisted,
        metadata: {
          views: Number(eventWithId.views) + 1,
          wishlistCount: eventWithId.wishlistCount,
          rating: {
            average: eventWithId.ratingAverage,
            count: eventWithId.ratingCount,
          },
        },
      };
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      // Return mock event for development
      return this.getMockEvent(eventId, userId);
    }
  }
  
  private async getSimilarEvents(event: any): Promise<any[]> {
    try {
      const eventWithId = event as any;
      // Find similar events by category, tags, and location
      const similarEvents = await prisma.event.findMany({
        where: {
          id: { not: eventWithId.id },
          status: 'ACTIVE',
          visibility: { in: ['PUBLIC', 'UNLISTED'] },
          startDate: { gte: new Date() },
          OR: [
            { category: eventWithId.category },
            { city: eventWithId.city },
          ],
        },
        take: 6,
        select: this.getEventSelectFields(),
        orderBy: [
          { isFeatured: 'desc' },
          { wishlistCount: 'desc' },
          { startDate: 'asc' },
        ],
      });
      
      return similarEvents.map(e => this.formatEventResponse(e));
    } catch (error) {
      console.error('Error fetching similar events:', error);
      return [];
    }
  }
  
  async getFeaturedEvents(city?: string, limit: number = 10): Promise<any[]> {
    try {
      const events = await prisma.event.findMany({
        where: {
          status: 'ACTIVE',
          isFeatured: true,
          featuredUntil: { gt: new Date() },
          startDate: { gte: new Date() },
          ...(city && { city }),
        },
        take: limit,
        select: this.getEventSelectFields(),
        orderBy: [
          { featuredOrder: 'asc' },
          { startDate: 'asc' },
        ],
      });
      
      return events.map(event => this.formatEventResponse(event));
    } catch (error) {
      console.error('Error fetching featured events:', error);
      return this.getMockEvents().slice(0, limit);
    }
  }
  
  async getTodaysEvents(city?: string, limit: number = 20): Promise<any[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const events = await prisma.event.findMany({
        where: {
          status: 'ACTIVE',
          visibility: { in: ['PUBLIC', 'UNLISTED'] },
          startDate: {
            gte: today,
            lt: tomorrow,
          },
          ...(city && { city }),
        },
        take: limit,
        select: this.getEventSelectFields(),
        orderBy: [
          { startDate: 'asc' },
          { isFeatured: 'desc' },
        ],
      });
      
      return events.map(event => this.formatEventResponse(event));
    } catch (error) {
      console.error('Error fetching today\'s events:', error);
      return this.getMockEvents().slice(0, limit);
    }
  }
  
  async getWeekendEvents(city?: string, limit: number = 20): Promise<any[]> {
    try {
      const weekendStart = this.getWeekendStart();
      const weekendEnd = this.getWeekendEnd();
      
      const events = await prisma.event.findMany({
        where: {
          status: 'ACTIVE',
          visibility: { in: ['PUBLIC', 'UNLISTED'] },
          startDate: {
            gte: weekendStart,
            lte: weekendEnd,
          },
          ...(city && { city }),
        },
        take: limit,
        select: this.getEventSelectFields(),
        orderBy: [
          { startDate: 'asc' },
          { isFeatured: 'desc' },
        ],
      });
      
      return events.map(event => this.formatEventResponse(event));
    } catch (error) {
      console.error('Error fetching weekend events:', error);
      return this.getMockEvents().slice(0, limit);
    }
  }
  
  private getWeekendStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : 5 - day;
    const weekendStart = new Date(now);
    weekendStart.setDate(now.getDate() + diff);
    weekendStart.setHours(0, 0, 0, 0);
    return weekendStart;
  }
  
  private getWeekendEnd(): Date {
    const weekendStart = this.getWeekendStart();
    const weekendEnd = new Date(weekendStart);
    weekendEnd.setDate(weekendStart.getDate() + 2);
    weekendEnd.setHours(23, 59, 59, 999);
    return weekendEnd;
  }
  
  async searchEvents(filters: any): Promise<any[]> {
    try {
      const where: Prisma.EventWhereInput = {
        status: 'ACTIVE',
        visibility: { in: ['PUBLIC', 'UNLISTED'] },
        startDate: { gte: new Date() },
      };
      
      if (filters.categories && filters.categories.length > 0) {
        where.category = { in: filters.categories };
      }
      
      if (filters.dateRange) {
        where.startDate = {};
        if (filters.dateRange.start) {
          where.startDate.gte = new Date(filters.dateRange.start);
        }
        if (filters.dateRange.end) {
          where.startDate.lte = new Date(filters.dateRange.end);
        }
      }
      
      if (filters.priceRange) {
        where.OR = [
          { isFree: true },
          {
            AND: [
              filters.priceRange.min !== undefined ? { priceFrom: { gte: new Prisma.Decimal(filters.priceRange.min) } } : {},
              filters.priceRange.max !== undefined ? { priceFrom: { lte: new Prisma.Decimal(filters.priceRange.max) } } : {},
            ]
          }
        ];
      }
      
      if (filters.location && filters.location.city) {
        where.city = filters.location.city;
      }
      
      if (filters.keywords && filters.keywords.length > 0) {
        where.OR = filters.keywords.map((keyword: string) => ({
          OR: [
            { title: { contains: keyword } },
            { description: { contains: keyword } },
            { venueName: { contains: keyword } },
          ]
        }));
      }
      
      if (filters.requirements && filters.requirements.length > 0) {
        if (filters.requirements.includes('pet-friendly')) {
          where.isPetFriendly = true;
        }
        if (filters.requirements.includes('wheelchair-accessible')) {
          where.isWheelchairAccessible = true;
        }
      }
      
      const events = await prisma.event.findMany({
        where,
        take: 50,
        select: this.getEventSelectFields(),
        orderBy: [
          { isFeatured: 'desc' },
          { startDate: 'asc' },
        ],
      });
      
      return events.map(event => this.formatEventResponse(event));
    } catch (error) {
      console.error('Error searching events:', error);
      return this.getMockEvents().slice(0, 10);
    }
  }
  
  async searchSuggestions(query: string, city?: string, limit: number = 10): Promise<any[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }
      
      const events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { venueName: { contains: query } },
          ],
          status: 'ACTIVE',
          startDate: { gte: new Date() },
          ...(city && { city }),
        },
        take: limit,
        select: {
          id: true,
          migoId: true,
          title: true,
          category: true,
          startDate: true,
          venueName: true,
          city: true,
          priceFrom: true,
          priceTo: true,
          isFree: true,
          coverImage: true,
        },
        orderBy: [
          { isFeatured: 'desc' },
          { wishlistCount: 'desc' },
        ],
      });
      
      const categories = await prisma.event.findMany({
        where: {
          OR: [
            { category: { contains: query } },
            { subcategory: { contains: query } },
          ],
          status: 'ACTIVE',
          startDate: { gte: new Date() },
          ...(city && { city }),
        },
        distinct: ['category'],
        take: 5,
        select: { category: true },
      });
      
      return [
        ...events.map(event => ({
          type: 'event',
          id: (event as any).migoId ? (event as any).migoId.toString() : (event as any).id,
          title: event.title,
          subtitle: `${event.venueName}, ${event.city}`,
          image: event.coverImage,
          metadata: {
            date: event.startDate,
            price: event.isFree ? 'Free' : `${event.priceFrom} - ${event.priceTo} AED`,
            category: event.category,
          },
        })),
        ...categories.map(cat => ({
          type: 'category',
          id: `category_${cat.category?.toLowerCase().replace(/\s+/g, '-')}`,
          title: `Category: ${cat.category}`,
          subtitle: `Browse all ${cat.category} events`,
          image: null,
          metadata: { category: cat.category },
        })),
      ];
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      return [];
    }
  }
  
  async getQuickFilters(): Promise<any> {
    try {
      // Fetch all active events (including past events for filter purposes)
      // This ensures we show cities even if there are no upcoming events
      const events = await prisma.event.findMany({
        where: {
          status: 'ACTIVE',
        },
        select: {
          category: true,
          city: true,
          venueName: true,
        },
      });

      // Group by category manually
      const categoryMap = new Map<string, number>();
      events.forEach(event => {
        if (event.category) {
          categoryMap.set(event.category, (categoryMap.get(event.category) || 0) + 1);
        }
      });

      // Group by city manually
      const cityMap = new Map<string, number>();
      events.forEach(event => {
        if (event.city) {
          cityMap.set(event.city, (cityMap.get(event.city) || 0) + 1);
        }
      });

      // Group by venue manually
      const venueMap = new Map<string, number>();
      events.forEach(event => {
        if (event.venueName) {
          venueMap.set(event.venueName, (venueMap.get(event.venueName) || 0) + 1);
        }
      });

      // Convert to arrays and sort by count
      const categories = Array.from(categoryMap.entries())
        .map(([name, count]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const cities = Array.from(cityMap.entries())
        .map(([name, count]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const venues = Array.from(venueMap.entries())
        .map(([name, count]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      console.log('QuickFilters - Found categories:', categories.length, 'cities:', cities.length, 'venues:', venues.length);

      return {
        categories,
        cities,
        venues,
        priceRanges: [
          { id: 'free', name: 'Free', min: 0, max: 0 },
          { id: 'under-50', name: 'Under 50 AED', min: 1, max: 50 },
          { id: '50-100', name: '50 - 100 AED', min: 50, max: 100 },
          { id: '100-200', name: '100 - 200 AED', min: 100, max: 200 },
          { id: '200-plus', name: '200+ AED', min: 200, max: 10000 },
        ],
        dates: await this.getUpcomingDateRanges(),
        types: [
          { id: 'concert', name: 'Concerts', icon: '🎵' },
          { id: 'exhibition', name: 'Exhibitions', icon: '🎨' },
          { id: 'festival', name: 'Festivals', icon: '🎪' },
          { id: 'conference', name: 'Conferences', icon: '💼' },
          { id: 'workshop', name: 'Workshops', icon: '🔧' },
          { id: 'sports', name: 'Sports', icon: '⚽' },
          { id: 'food', name: 'Food & Drink', icon: '🍔' },
          { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦' },
          { id: 'business', name: 'Business', icon: '💼' },
          { id: 'networking', name: 'Networking', icon: '🤝' },
        ],
        features: [
          { id: 'pet-friendly', name: 'Pet Friendly', icon: '🐾' },
          { id: 'free', name: 'Free Entry', icon: '🎫' },
          { id: 'wheelchair-accessible', name: 'Wheelchair Accessible', icon: '♿' },
          { id: 'outdoor', name: 'Outdoor', icon: '🌳' },
          { id: 'indoor', name: 'Indoor', icon: '🏠' },
          { id: 'food-available', name: 'Food Available', icon: '🍽️' },
          { id: 'alcohol-served', name: 'Alcohol Served', icon: '🍷' },
        ],
      };
    } catch (error) {
      console.error('Error fetching quick filters:', error);
      return {
        categories: [],
        cities: [],
        priceRanges: [],
        dates: [],
        types: [],
        features: [],
      };
    }
  }
  
  private async getUpcomingDateRanges(): Promise<any[]> {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const thisWeekend = this.getWeekendStart();
      const nextWeekend = new Date(thisWeekend);
      nextWeekend.setDate(nextWeekend.getDate() + 7);
      
      const [todayCount, weekendCount] = await Promise.all([
        prisma.event.count({
          where: {
            status: 'ACTIVE',
            startDate: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
        prisma.event.count({
          where: {
            status: 'ACTIVE',
            startDate: {
              gte: thisWeekend,
              lte: this.getWeekendEnd(),
            },
          },
        }),
      ]);
      
      return [
        { id: 'today', name: 'Today', date: today, count: todayCount },
        { id: 'tomorrow', name: 'Tomorrow', date: tomorrow, count: 0 },
        { id: 'this-weekend', name: 'This Weekend', date: thisWeekend, count: weekendCount },
        { id: 'next-weekend', name: 'Next Weekend', date: nextWeekend, count: 0 },
        { id: 'this-month', name: 'This Month', date: today, count: 0 },
      ];
    } catch (error) {
      return [
        { id: 'today', name: 'Today', date: new Date(), count: 0 },
        { id: 'tomorrow', name: 'Tomorrow', date: new Date(), count: 0 },
        { id: 'this-weekend', name: 'This Weekend', date: new Date(), count: 0 },
        { id: 'next-weekend', name: 'Next Weekend', date: new Date(), count: 0 },
        { id: 'this-month', name: 'This Month', date: new Date(), count: 0 },
      ];
    }
  }
  
  private getEventSelectFields(userId?: string, fullDetails: boolean = false) {
    const baseSelect: any = {
      id: true,
      migoId: true,
      slug: true,
      title: true,
      tagline: true,
      description: fullDetails,
      shortDescription: true,
      category: true,
      subcategory: true,
      tags: true,
      ageGroup: true,
      startDate: true,
      endDate: true,
      durationMinutes: true,
      timezone: true,
      isRecurring: true,
      venueName: true,
      address: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
      locationType: true,
      onlineUrl: true,
      priceFrom: true,
      priceTo: true,
      currency: true,
      isFree: true,
      ticketUrl: true,
      bookingType: true,
      capacity: true,
      ticketsSold: true,
      ticketsAvailable: true,
      images: true,
      coverImage: true,
      thumbnailImage: true,
      videoUrl: true,
      isPetFriendly: true,
      isWheelchairAccessible: true,
      hasParking: true,
      hasFood: true,
      hasDrinks: true,
      hasWiFi: true,
      facilities: true,
      dressCode: true,
      ageRestriction: true,
      status: true,
      visibility: true,
      isFeatured: true,
      isSponsored: true,
      isVerified: true,
      featuredOrder: true,
      featuredUntil: true,
      externalId: true,
      externalSource: true,
      source: true,
      externalUrl: true,
      organizerEmail: true,
      organizerPhone: true,
      supportEmail: true,
      supportPhone: true,
      website: true,
      views: true,
      uniqueViews: true,
      wishlistCount: true,
      shareCount: true,
      clickCount: true,
      ratingAverage: true,
      ratingCount: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
      approvedAt: true,
      organizerId: true,
    };
    
    if (fullDetails) {
      baseSelect.gallery = true;
      baseSelect.socialLinks = true;
    }
    
    if (userId && fullDetails) {
      baseSelect.wishlists = {
        where: { userId },
        select: { id: true },
      };
      baseSelect.bookings = {
        where: { userId },
        select: { id: true, status: true },
      };
    }
    
    return baseSelect;
  }
  
  private formatEventResponse(event: any, userId?: string): any {
    const eventAny = event as any;
    // Return flat structure matching shared Event type
    const formatted: any = {
      id: eventAny.migoId ? eventAny.migoId.toString() : eventAny.id,
      slug: eventAny.slug,
      title: eventAny.title,
      tagline: eventAny.tagline,
      description: eventAny.description,
      shortDescription: eventAny.shortDescription,
      category: eventAny.category,
      subcategory: eventAny.subcategory,
      tags: eventAny.tags || [],
      ageGroup: eventAny.ageGroup,

      // Dates - flat structure
      startDate: eventAny.startDate,
      endDate: eventAny.endDate,
      durationMinutes: eventAny.durationMinutes,
      timezone: eventAny.timezone,
      isRecurring: eventAny.isRecurring,

      // Location - flat structure with latitude/longitude
      venueName: eventAny.venueName,
      address: eventAny.address,
      city: eventAny.city,
      country: eventAny.country,
      latitude: eventAny.latitude ? Number(eventAny.latitude) : undefined,
      longitude: eventAny.longitude ? Number(eventAny.longitude) : undefined,
      locationType: eventAny.locationType,
      onlineUrl: eventAny.onlineUrl,

      // Pricing - flat structure matching shared Event type
      priceFrom: eventAny.priceFrom ? Number(eventAny.priceFrom) : undefined,
      priceTo: eventAny.priceTo ? Number(eventAny.priceTo) : undefined,
      currency: eventAny.currency,
      isFree: eventAny.isFree,
      ticketUrl: eventAny.ticketUrl,
      bookingType: eventAny.bookingType,

      // Capacity
      capacity: eventAny.capacity,
      availableTickets: eventAny.ticketsAvailable,

      // Media
      images: eventAny.images || [],
      coverImage: eventAny.coverImage,
      thumbnail: eventAny.thumbnailImage,
      videoUrl: eventAny.videoUrl,
      gallery: eventAny.gallery || [],

      // Features - flat structure
      isPetFriendly: eventAny.isPetFriendly,
      isWheelchairAccessible: eventAny.isWheelchairAccessible,
      hasParking: eventAny.hasParking,
      hasFood: eventAny.hasFood,
      hasDrinks: eventAny.hasDrinks,
      hasWiFi: eventAny.hasWiFi,
      facilities: eventAny.facilities || [],
      dressCode: eventAny.dressCode,
      ageRestriction: eventAny.ageRestriction,

      // Status & visibility
      status: eventAny.status,
      visibility: eventAny.visibility,
      isFeatured: eventAny.isFeatured,
      isSponsored: eventAny.isSponsored,
      isVerified: eventAny.isVerified,

      // External - use externalSource instead of source
      externalId: eventAny.externalId,
      externalSource: eventAny.externalSource || eventAny.source,
      externalUrl: eventAny.externalUrl,

      // Contact - flat structure
      organizerEmail: eventAny.organizerEmail,
      organizerPhone: eventAny.organizerPhone,
      supportEmail: eventAny.supportEmail,
      supportPhone: eventAny.supportPhone,
      website: eventAny.website,
      socialLinks: eventAny.socialLinks || {},

      // Relations
      organizerId: eventAny.organizerId,

      // Stats - flat structure
      viewCount: Number(eventAny.views) || 0,
      wishlistCount: Number(eventAny.wishlistCount) || 0,
      shareCount: Number(eventAny.shareCount) || 0,
      averageRating: Number(eventAny.ratingAverage) || 0,
      reviewCount: Number(eventAny.ratingCount) || 0,

      // Timestamps
      createdAt: eventAny.createdAt,
      updatedAt: eventAny.updatedAt,
      publishedAt: eventAny.publishedAt,
        featuredUntil: eventAny.featuredUntil,
    };

    // Add user-specific fields matching shared Event type
    if (userId) {
      formatted.isBookmarked = eventAny.wishlists && eventAny.wishlists.length > 0;
      if (eventAny.bookings && eventAny.bookings.length > 0) {
        const booking = eventAny.bookings[0];
        formatted.userBooking = {
          id: booking.id,
          status: booking.status,
          ticketCount: booking.ticketCount || 1,
        };
      }
    }

    return formatted;
  }
  
  async createEvent(userId: string, eventData: any): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isOrganizer: true },
      });
      
      if (!user?.isOrganizer) {
        throw new Error('User is not an organizer');
      }
      
      const slug = this.generateSlug(eventData.title);
      
      const eventDataWithDates = {
        ...eventData,
        startDate: new Date(eventData.startDate),
        endDate: eventData.endDate ? new Date(eventData.endDate) : null,
        slug,
        organizerId: userId,
        status: 'PENDING',
        publishedAt: new Date(),
      };
      
      const event = await prisma.event.create({
        data: eventDataWithDates,
        select: this.getEventSelectFields(userId, true),
      });
      
      await prisma.user.update({
        where: { id: userId },
        data: { eventCount: { increment: 1 } }
      });
      
      await prisma.organizerProfile.upsert({
        where: { userId },
        update: { totalEvents: { increment: 1 } },
        create: {
          userId,
          businessName: eventData.venueName || 'Unknown Business',
          businessEmail: eventData.organizerEmail || '',
          businessPhone: eventData.organizerPhone || '',
        }
      });
      
      return this.formatEventResponse(event, userId);
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }
  
  async updateEvent(eventId: string, userId: string, updateData: any): Promise<any> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true, status: true },
      });
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      if (event.organizerId !== userId) {
        throw new Error('Not authorized to update this event');
      }
      
      const updatedData: any = { ...updateData };
      if (updateData.title) {
        updatedData.slug = this.generateSlug(updateData.title);
      }
      
      if (updateData.startDate) {
        updatedData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updatedData.endDate = new Date(updateData.endDate);
      }
      
      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: {
          ...updatedData,
          updatedAt: new Date(),
          ...(this.requiresReapproval(updateData) && { status: 'PENDING' }),
        },
        select: this.getEventSelectFields(userId, true),
      });
      
      return this.formatEventResponse(updatedEvent, userId);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }
  
  async deleteEvent(eventId: string, userId: string): Promise<void> {
    try {
      const [event, user] = await Promise.all([
        prisma.event.findUnique({
          where: { id: eventId },
          select: { organizerId: true },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { isAdmin: true },
        }),
      ]);
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      if (event.organizerId !== userId && !user?.isAdmin) {
        throw new Error('Not authorized to delete this event');
      }
      
      await prisma.event.update({
        where: { id: eventId },
        data: {
          status: 'ARCHIVED',
          updatedAt: new Date(),
        }
      });
      
      await prisma.user.update({
        where: { id: event.organizerId },
        data: { eventCount: { decrement: 1 } }
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
  
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 100);
  }
  
  private requiresReapproval(updateData: any): boolean {
    const criticalFields = [
      'title',
      'category',
      'startDate',
      'venueName',
      'address',
      'priceFrom',
      'priceTo',
      'isFree',
      'images',
    ];
    
    return Object.keys(updateData).some(key => criticalFields.includes(key));
  }
  
  async toggleWishlist(userId: string, eventId: string): Promise<{ isWishlisted: boolean; count: number }> {
    try {
      const existing = await prisma.wishlist.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          }
        }
      });
      
      if (existing) {
        await prisma.$transaction([
          prisma.wishlist.delete({
            where: {
              userId_eventId: {
                userId,
                eventId,
              }
            }
          }),
          prisma.event.update({
            where: { id: eventId },
            data: { wishlistCount: { decrement: 1 } }
          }),
          prisma.user.update({
            where: { id: userId },
            data: { wishlistCount: { decrement: 1 } }
          }),
        ]);
        
        const updatedEvent = await prisma.event.findUnique({
          where: { id: eventId },
          select: { wishlistCount: true }
        });
        
        return {
          isWishlisted: false,
          count: updatedEvent?.wishlistCount || 0,
        };
      } else {
        await prisma.$transaction([
          prisma.wishlist.create({
            data: {
              userId,
              eventId,
            }
          }),
          prisma.event.update({
            where: { id: eventId },
            data: { wishlistCount: { increment: 1 } }
          }),
          prisma.user.update({
            where: { id: userId },
            data: { wishlistCount: { increment: 1 } }
          }),
        ]);
        
        const updatedEvent = await prisma.event.findUnique({
          where: { id: eventId },
          select: { wishlistCount: true }
        });
        
        return {
          isWishlisted: true,
          count: updatedEvent?.wishlistCount || 1,
        };
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      throw error;
    }
  }
  
  // Mock data for development
  private getMockEvents() {
    return [
      {
        id: '1',
        title: 'Tech Conference 2024',
        description: 'Annual tech conference featuring the latest in AI, Web3, and Cloud Computing',
        startDate: new Date('2024-04-15'),
        endDate: new Date('2024-04-16'),
        venueName: 'Convention Center',
        city: 'San Francisco',
        country: 'USA',
        priceFrom: 299.99,
        priceTo: 299.99,
        currency: 'USD',
        isFree: false,
        category: 'Tech',
        coverImage: 'https://example.com/tech-conference.jpg',
        tags: ['technology', 'conference', 'ai'],
        ratingAverage: 4.5,
        ratingCount: 120,
        wishlistCount: 45,
      },
      {
        id: '2',
        title: 'Free Yoga Class',
        description: 'Morning yoga session in the park',
        startDate: new Date('2024-03-22'),
        endDate: new Date('2024-03-22'),
        venueName: 'City Park',
        city: 'New York',
        country: 'USA',
        priceFrom: 0,
        priceTo: 0,
        currency: 'USD',
        isFree: true,
        category: 'Health',
        coverImage: 'https://example.com/yoga.jpg',
        tags: ['yoga', 'wellness', 'free'],
        ratingAverage: 4.8,
        ratingCount: 89,
        wishlistCount: 32,
      },
    ];
  }
  
  private getMockEvent(id: string, userId?: string) {
    return {
      id,
      title: 'Sample Event',
      description: 'This is a sample event for development',
      organizer: {
        id: 'org1',
        displayName: 'Event Organizer',
        avatarUrl: 'https://example.com/avatar.jpg',
        isVerified: true,
        isOrganizer: true,
      },
      similarEvents: this.getMockEvents().slice(0, 3),
      reviews: [],
      isWishlisted: false,
      metadata: {
        views: 150,
        wishlistCount: 25,
        rating: {
          average: 4.5,
          count: 10,
        },
      },
    };
  }
}

export const eventService = new EventService();