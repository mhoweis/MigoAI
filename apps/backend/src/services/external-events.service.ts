// src/services/external-events.service.ts
import axios, { AxiosInstance } from 'axios';
import config from '../config/env';
import logger from '../utils/logger';
import prisma from '../database/prisma';

interface ExternalEvent {
  externalId: string;
  externalSource: string;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  address?: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  price?: number;
  currency?: string;
  category?: string;
  url?: string;
}

class ExternalEventsService {
  private ticketmasterClient: AxiosInstance;
  private eventbriteClient: AxiosInstance;
  private meetupClient: AxiosInstance;
  private platinumlistClient: AxiosInstance;

  constructor() {
    // Ticketmaster API Client
    this.ticketmasterClient = axios.create({
      baseURL: 'https://app.ticketmaster.com/discovery/v2',
      timeout: 10000,
      params: {
        apikey: config.TICKETMASTER_API_KEY,
      },
    });

    // Eventbrite API Client
    this.eventbriteClient = axios.create({
      baseURL: 'https://www.eventbriteapi.com/v3',
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${config.EVENTBRITE_API_KEY}`,
      },
    });

    // Meetup API Client
    this.meetupClient = axios.create({
      baseURL: 'https://api.meetup.com',
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${config.MEETUP_API_KEY}`,
      },
    });

    // Platinumlist API Client
    this.platinumlistClient = axios.create({
      baseURL: 'https://api.platinumlist.net',
      timeout: 10000,
      headers: {
        'X-API-Key': config.PLATINUMLIST_API_KEY,
      },
    });
  }

  /**
   * Fetch events from Ticketmaster
   */
  async fetchTicketmasterEvents(params: {
    city?: string;
    countryCode?: string;
    keyword?: string;
    startDateTime?: string;
    size?: number;
  } = {}): Promise<ExternalEvent[]> {
    if (!config.TICKETMASTER_API_KEY) {
      logger.warn('Ticketmaster API key not configured');
      return [];
    }

    try {
      const response = await this.ticketmasterClient.get('/events.json', {
        params: {
          city: params.city,
          countryCode: params.countryCode || 'US',
          keyword: params.keyword,
          startDateTime: params.startDateTime,
          size: params.size || 200,
          sort: 'date,asc',
        },
      });

      logger.info(`Ticketmaster API Response Status: ${response.status}`);
      logger.info(`Total Events Available: ${response.data.page?.totalElements || 0}`);

      const events = response.data._embedded?.events || [];
      logger.info(`Events in Response: ${events.length}`);

      return events.map((event: any) => this.transformTicketmasterEvent(event));
    } catch (error: any) {
      logger.error('Error fetching Ticketmaster events:', error.message);
      return [];
    }
  }

  /**
   * Fetch events from Eventbrite
   */
  async fetchEventbriteEvents(params: {
    location?: string;
    q?: string;
    'start_date.range_start'?: string;
    expand?: string;
  } = {}): Promise<ExternalEvent[]> {
    if (!config.EVENTBRITE_API_KEY) {
      logger.warn('Eventbrite API key not configured');
      return [];
    }

    try {
      const response = await this.eventbriteClient.get('/events/search/', {
        params: {
          'location.address': params.location || 'Dubai',
          q: params.q,
          'start_date.range_start': params['start_date.range_start'] || new Date().toISOString(),
          expand: 'venue,category',
          sort_by: 'date',
        },
      });

      const events = response.data.events || [];

      return events.map((event: any) => this.transformEventbriteEvent(event));
    } catch (error: any) {
      logger.error('Error fetching Eventbrite events:', error.message);
      return [];
    }
  }

  /**
   * Fetch events from Meetup
   */
  async fetchMeetupEvents(params: {
    lat?: number;
    lon?: number;
    radius?: number;
    text?: string;
  } = {}): Promise<ExternalEvent[]> {
    if (!config.MEETUP_API_KEY) {
      logger.warn('Meetup API key not configured');
      return [];
    }

    try {
      const response = await this.meetupClient.get('/find/events', {
        params: {
          lat: params.lat || 25.2048, // Dubai default
          lon: params.lon || 55.2708,
          radius: params.radius || 50,
          text: params.text,
          fields: 'group_photo,featured_photo',
        },
      });

      const events = response.data || [];

      return events.map((event: any) => this.transformMeetupEvent(event));
    } catch (error: any) {
      logger.error('Error fetching Meetup events:', error.message);
      return [];
    }
  }

  /**
   * Fetch events from Platinumlist (UAE/Dubai events)
   */
  async fetchPlatinumlistEvents(params: {
    city?: string;
    category?: string;
    date?: string;
    limit?: number;
  } = {}): Promise<ExternalEvent[]> {
    if (!config.PLATINUMLIST_API_KEY) {
      logger.warn('Platinumlist API key not configured');
      return [];
    }

    try {
      // Note: Adjust endpoint based on actual Platinumlist API documentation
      // This is a generic implementation that may need to be updated
      const response = await this.platinumlistClient.get('/events', {
        params: {
          city: params.city || 'Dubai',
          category: params.category,
          date: params.date,
          limit: params.limit || 20,
        },
      });

      const events = response.data?.events || response.data || [];

      return events.map((event: any) => this.transformPlatinumlistEvent(event));
    } catch (error: any) {
      logger.error('Error fetching Platinumlist events:', error.message);
      return [];
    }
  }

  /**
   * Fetch events from all sources
   */
  async fetchAllEvents(params: {
    city?: string;
    country?: string;
    keyword?: string;
  } = {}): Promise<ExternalEvent[]> {
    logger.info('Fetching events from all external sources...');

    const [ticketmasterEvents, eventbriteEvents, meetupEvents, platinumlistEvents] = await Promise.allSettled([
      this.fetchTicketmasterEvents({
        city: params.city,
        countryCode: params.country,
        keyword: params.keyword,
      }),
      this.fetchEventbriteEvents({
        location: params.city,
        q: params.keyword,
      }),
      this.fetchMeetupEvents({
        text: params.keyword,
      }),
      this.fetchPlatinumlistEvents({
        city: params.city,
      }),
    ]);

    const allEvents: ExternalEvent[] = [];

    if (ticketmasterEvents.status === 'fulfilled') {
      allEvents.push(...ticketmasterEvents.value);
      logger.info(`Fetched ${ticketmasterEvents.value.length} events from Ticketmaster`);
    }

    if (eventbriteEvents.status === 'fulfilled') {
      allEvents.push(...eventbriteEvents.value);
      logger.info(`Fetched ${eventbriteEvents.value.length} events from Eventbrite`);
    }

    if (meetupEvents.status === 'fulfilled') {
      allEvents.push(...meetupEvents.value);
      logger.info(`Fetched ${meetupEvents.value.length} events from Meetup`);
    }

    if (platinumlistEvents.status === 'fulfilled') {
      allEvents.push(...platinumlistEvents.value);
      logger.info(`Fetched ${platinumlistEvents.value.length} events from Platinumlist`);
    }

    logger.info(`Total external events fetched: ${allEvents.length}`);
    return allEvents;
  }

  /**
   * Sync external events to database
   */
  async syncEventsToDatabase(events: ExternalEvent[]): Promise<{ created: number; updated: number; errors: number }> {
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const event of events) {
      try {
        // Check if event already exists
        const existingEvent = await prisma.event.findFirst({
          where: {
            externalId: event.externalId,
            externalSource: event.externalSource,
          },
        });

        const eventData = {
          title: event.name,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          venueName: event.location,
          address: event.address,
          city: event.city,
          country: event.country,
          latitude: event.latitude,
          longitude: event.longitude,
          coverImage: event.imageUrl,
          priceFrom: event.price,
          currency: event.currency || 'USD',
          category: this.mapToEventCategory(event.category),
          externalId: event.externalId,
          externalSource: event.externalSource,
          externalUrl: event.url,
        };

        if (existingEvent) {
          // Update existing event
          await prisma.event.update({
            where: { id: existingEvent.id },
            data: eventData,
          });
          updated++;
        } else {
          // Create new event (need to assign to a user - using first admin or system user)
          const systemUser = await prisma.user.findFirst({
            where: { email: 'system@migo.events' },
          });

          if (!systemUser) {
            logger.warn('System user not found, skipping event creation');
            errors++;
            continue;
          }

          await prisma.event.create({
            data: {
              ...eventData,
              organizerId: systemUser.id,
              status: 'ACTIVE',
              visibility: 'PUBLIC',
            },
          });
          created++;
        }
      } catch (error: any) {
        logger.error(`Error syncing event ${event.externalId}:`, error.message);
        errors++;
      }
    }

    logger.info(`Event sync complete: ${created} created, ${updated} updated, ${errors} errors`);
    return { created, updated, errors };
  }

  /**
   * Transform Ticketmaster event to internal format
   */
  private transformTicketmasterEvent(event: any): ExternalEvent {
    const venue = event._embedded?.venues?.[0];
    const image = event.images?.[0];
    const priceRange = event.priceRanges?.[0];

    return {
      externalId: event.id,
      externalSource: 'ticketmaster',
      name: event.name,
      description: event.info || event.pleaseNote || '',
      startDate: new Date(event.dates.start.dateTime || event.dates.start.localDate),
      endDate: event.dates.end?.dateTime ? new Date(event.dates.end.dateTime) : undefined,
      location: venue?.name || '',
      address: venue?.address?.line1,
      city: venue?.city?.name || '',
      country: venue?.country?.countryCode || '',
      latitude: venue?.location?.latitude ? parseFloat(venue.location.latitude) : undefined,
      longitude: venue?.location?.longitude ? parseFloat(venue.location.longitude) : undefined,
      imageUrl: image?.url,
      price: priceRange?.min,
      currency: priceRange?.currency || 'USD',
      category: event.classifications?.[0]?.segment?.name,
      url: event.url,
    };
  }

  /**
   * Transform Eventbrite event to internal format
   */
  private transformEventbriteEvent(event: any): ExternalEvent {
    const venue = event.venue;
    const image = event.logo?.url;

    return {
      externalId: event.id,
      externalSource: 'eventbrite',
      name: event.name.text,
      description: event.description?.text || '',
      startDate: new Date(event.start.utc),
      endDate: new Date(event.end.utc),
      location: venue?.name || '',
      address: venue?.address?.localized_address_display,
      city: venue?.address?.city || '',
      country: venue?.address?.country || '',
      latitude: venue?.latitude ? parseFloat(venue.latitude) : undefined,
      longitude: venue?.longitude ? parseFloat(venue.longitude) : undefined,
      imageUrl: image,
      price: event.is_free ? 0 : undefined,
      currency: event.currency || 'USD',
      category: event.category?.name,
      url: event.url,
    };
  }

  /**
   * Transform Meetup event to internal format
   */
  private transformMeetupEvent(event: any): ExternalEvent {
    const venue = event.venue;
    const group = event.group;

    return {
      externalId: event.id,
      externalSource: 'meetup',
      name: event.name,
      description: event.description || '',
      startDate: new Date(event.time),
      endDate: event.duration ? new Date(event.time + event.duration) : undefined,
      location: venue?.name || group?.name || '',
      address: venue?.address_1,
      city: venue?.city || group?.localized_location || '',
      country: venue?.country || '',
      latitude: venue?.lat || event.lat,
      longitude: venue?.lon || event.lon,
      imageUrl: event.featured_photo?.photo_link || group?.group_photo?.photo_link,
      price: event.fee?.amount ? parseFloat(event.fee.amount) : 0,
      currency: event.fee?.currency || 'USD',
      category: group?.category?.name,
      url: event.link,
    };
  }

  /**
   * Transform Platinumlist event to internal format
   */
  private transformPlatinumlistEvent(event: any): ExternalEvent {
    // Note: Adjust field mapping based on actual Platinumlist API response structure
    // This is a generic implementation based on common event API patterns
    const venue = event.venue || {};
    const location = event.location || {};

    return {
      externalId: event.id || event.event_id || event._id,
      externalSource: 'platinumlist',
      name: event.name || event.title || event.event_name || '',
      description: event.description || event.summary || event.details || '',
      startDate: new Date(event.start_date || event.date || event.start_time),
      endDate: event.end_date ? new Date(event.end_date) : undefined,
      location: venue.name || location.name || event.venue_name || '',
      address: venue.address || location.address || event.address || '',
      city: venue.city || location.city || event.city || 'Dubai',
      country: venue.country || location.country || event.country || 'AE',
      latitude: venue.latitude || location.lat || event.lat,
      longitude: venue.longitude || location.lng || event.lng,
      imageUrl: event.image || event.image_url || event.poster_url || event.thumbnail,
      price: event.price || event.ticket_price || event.min_price || 0,
      currency: event.currency || 'AED',
      category: event.category || event.type || event.event_type,
      url: event.url || event.link || event.event_url || `https://dubai.platinumlist.net/event/${event.id}`,
    };
  }

  /**
   * Map external category to internal category string
   */
  private mapToEventCategory(externalCategory?: string): string {
    if (!externalCategory) return 'Other';

    const categoryMap: Record<string, string> = {
      'Music': 'Music',
      'Sports': 'Sports',
      'Arts': 'Arts & Culture',
      'Theater': 'Arts & Culture',
      'Family': 'Family',
      'Food': 'Food & Drink',
      'Nightlife': 'Nightlife',
      'Business': 'Business',
      'Tech': 'Technology',
      'Technology': 'Technology',
      'Education': 'Education',
      'Health': 'Health & Wellness',
      'Fitness': 'Health & Wellness',
      'Community': 'Community',
    };

    const normalized = externalCategory.toLowerCase();
    for (const [key, value] of Object.entries(categoryMap)) {
      if (normalized.includes(key.toLowerCase())) {
        return value;
      }
    }

    return 'Other';
  }
}

export default new ExternalEventsService();
