// src/services/event-collector.ts
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Event, Prisma } from '@prisma/client';
import prisma from '../database/prisma';
import { env } from '../config/env';
import { BullQueue } from './queues';

interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  dates: {
    start: {
      localDate: string;
      localTime: string;
      dateTime: string;
    };
    end?: {
      localDate: string;
      localTime: string;
      dateTime: string;
    };
  };
  classifications: Array<{
    segment: { name: string };
    genre: { name: string };
    subGenre: { name: string };
  }>;
  _embedded: {
    venues: Array<{
      name: string;
      city: { name: string };
      country: { name: string };
      address: { line1: string };
      location: { latitude: string; longitude: string };
    }>;
    attractions?: Array<{ name: string }>;
  };
  priceRanges?: Array<{
    min: number;
    max: number;
    currency: string;
  }>;
  images: Array<{ url: string; ratio?: string; width?: number; height?: number }>;
  info?: string;
  pleaseNote?: string;
  ageRestrictions?: {
    legalAgeEnforced: boolean;
  };
}

export class EventCollector {
  private ticketmasterApiKey: string;
  
  constructor() {
    this.ticketmasterApiKey = env.TICKETMASTER_API_KEY;
  }
  
  async collectFromTicketmaster(city: string, country: string = 'AE'): Promise<number> {
    try {
      const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
        params: {
          apikey: this.ticketmasterApiKey,
          city: city,
          countryCode: country,
          size: 100,
          sort: 'date,asc',
          classificationName: 'music,arts&theatre,sports,miscellaneous',
          startDateTime: new Date().toISOString(),
          endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Next 30 days
        }
      });
      
      const events = response.data._embedded?.events || [];
      let collectedCount = 0;
      
      for (const tmEvent of events) {
        try {
          await this.saveTicketmasterEvent(tmEvent);
          collectedCount++;
        } catch (error) {
          console.error(`Failed to save event ${tmEvent.id}:`, error);
        }
      }
      
      console.log(`Collected ${collectedCount} events from Ticketmaster for ${city}`);
      return collectedCount;
      
    } catch (error) {
      console.error('Ticketmaster API Error:', error);
      throw error;
    }
  }
  
  private async saveTicketmasterEvent(tmEvent: TicketmasterEvent): Promise<void> {
    // Check if event already exists
    const existingEvent = await prisma.event.findUnique({
      where: { externalId: tmEvent.id }
    });
    
    if (existingEvent) {
      // Update existing event
      await prisma.event.update({
        where: { id: existingEvent.id },
        data: this.mapTicketmasterToEvent(tmEvent, existingEvent.organizerId)
      });
      return;
    }
    
    // Get or create organizer (system organizer for external events)
    const organizer = await prisma.user.findFirst({
      where: { email: 'system@migoai.com' }
    }) || await prisma.user.create({
      data: {
        email: 'system@migoai.com',
        name: 'MIGO AI System',
        authProvider: 'system',
      }
    });
    
    // Create new event
    await prisma.event.create({
      data: {
        ...this.mapTicketmasterToEvent(tmEvent, organizer.id),
        externalId: tmEvent.id,
        source: 'ticketmaster',
      }
    });
  }
  
  private mapTicketmasterToEvent(tmEvent: TicketmasterEvent, organizerId: string): Prisma.EventCreateInput {
    const venue = tmEvent._embedded?.venues?.[0];
    const classification = tmEvent.classifications?.[0];
    const priceRange = tmEvent.priceRanges?.[0];
    
    const images = tmEvent.images
      ?.filter(img => img.ratio === '16_9' && img.width >= 1024)
      .map(img => img.url)
      .slice(0, 5) || [];
    
    const coverImage = images[0] || '';
    
    // Extract facilities from description
    const facilities = this.extractFacilities(tmEvent.info || tmEvent.pleaseNote || '');
    
    return {
      title: tmEvent.name,
      slug: this.generateSlug(tmEvent.name),
      description: tmEvent.info || tmEvent.pleaseNote || `Event at ${venue?.name || 'Unknown venue'}`,
      shortDescription: tmEvent.info?.substring(0, 200) || '',
      
      category: classification?.segment?.name?.toLowerCase() || 'miscellaneous',
      subcategory: classification?.genre?.name?.toLowerCase() || 'general',
      tags: [
        classification?.segment?.name,
        classification?.genre?.name,
        classification?.subGenre?.name,
        venue?.city?.name,
      ].filter(Boolean).map(t => t!.toLowerCase()),
      
      startDate: new Date(tmEvent.dates.start.dateTime),
      endDate: tmEvent.dates.end ? new Date(tmEvent.dates.end.dateTime) : undefined,
      timezone: 'UTC', // Would need to parse from API
      
      venueName: venue?.name || 'Unknown Venue',
      address: venue?.address?.line1 || '',
      city: venue?.city?.name || 'Unknown',
      country: venue?.country?.name || 'Unknown',
      locationLat: parseFloat(venue?.location?.latitude || '0'),
      locationLng: parseFloat(venue?.location?.longitude || '0'),
      
      priceFrom: priceRange?.min ? new Prisma.Decimal(priceRange.min) : null,
      priceTo: priceRange?.max ? new Prisma.Decimal(priceRange.max) : null,
      currency: priceRange?.currency || 'USD',
      isFree: !priceRange?.min || priceRange.min === 0,
      ticketUrl: tmEvent.url,
      
      images,
      coverImage,
      
      ageRestriction: tmEvent.ageRestrictions?.legalAgeEnforced ? 21 : null,
      isPetFriendly: false, // Would need to parse from description
      facilities,
      accessibility: [], // Would need venue info

      status: 'ACTIVE',
      isVerified: true,
      
      organizer: { connect: { id: organizerId } },
    };
  }
  
  private extractFacilities(description: string): string[] {
    const facilities: string[] = [];
    const desc = description.toLowerCase();
    
    if (desc.includes('food') || desc.includes('restaurant') || desc.includes('dining')) {
      facilities.push('Food & Drinks');
    }
    if (desc.includes('parking')) {
      facilities.push('Parking');
    }
    if (desc.includes('wifi') || desc.includes('internet')) {
      facilities.push('WiFi');
    }
    if (desc.includes('accessible') || desc.includes('wheelchair')) {
      facilities.push('Wheelchair Accessible');
    }
    if (desc.includes('restroom') || desc.includes('washroom') || desc.includes('toilet')) {
      facilities.push('Washrooms');
    }
    
    return facilities;
  }
  
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  async scrapeLocalEvents(city: string): Promise<number> {
    if (!env.ENABLE_WEB_SCRAPING) return 0;
    
    const sources = [
      `https://www.timeout.com/${city.toLowerCase()}/things-to-do`,
      `https://www.eventbrite.com/d/${city.toLowerCase()}/all-events/`,
      `https://www.visitacity.com/en/${city.toLowerCase()}/events`,
    ];
    
    let scrapedCount = 0;
    
    for (const url of sources) {
      try {
        const events = await this.scrapeWebsite(url, city);
        scrapedCount += await this.saveScrapedEvents(events, city);
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
      }
    }
    
    return scrapedCount;
  }
  
  private async scrapeWebsite(url: string, city: string): Promise<any[]> {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MIGO/1.0; +http://migoai.com/bot)'
      }
    });
    
    const $ = cheerio.load(data);
    const events: any[] = [];
    
    // This is a simplified scraper - would need to be customized per website
    $('article, .event-card, .event-item').each((i, elem) => {
      const title = $(elem).find('h2, h3, .title').first().text().trim();
      const description = $(elem).find('.description, .summary').first().text().trim();
      const dateText = $(elem).find('.date, time').first().attr('datetime') || 
                       $(elem).find('.date, time').first().text().trim();
      const venue = $(elem).find('.venue, .location').first().text().trim();
      const image = $(elem).find('img').first().attr('src');
      
      if (title && dateText) {
        events.push({
          title,
          description,
          dateText,
          venue,
          image,
          city,
          sourceUrl: url,
        });
      }
    });
    
    return events;
  }
  
  private async saveScrapedEvents(scrapedEvents: any[], city: string): Promise<number> {
    let savedCount = 0;
    const organizer = await prisma.user.findFirst({
      where: { email: 'system@migoai.com' }
    });
    
    if (!organizer) return 0;
    
    for (const scrapedEvent of scrapedEvents) {
      try {
        // Parse date (simplified)
        const eventDate = this.parseDate(scrapedEvent.dateText);
        if (!eventDate || eventDate < new Date()) continue;
        
        await prisma.event.create({
          data: {
            title: scrapedEvent.title,
            slug: this.generateSlug(scrapedEvent.title),
            description: scrapedEvent.description || `Event in ${city}`,
            shortDescription: scrapedEvent.description?.substring(0, 200) || '',
            
            category: 'miscellaneous',
            subcategory: 'general',
            tags: ['local', city.toLowerCase(), 'scraped'],
            
            startDate: eventDate,
            timezone: 'UTC',
            
            venueName: scrapedEvent.venue || 'Various Locations',
            address: '',
            city,
            country: 'UAE',
            locationLat: 0,
            locationLng: 0,
            
            isFree: false,
            ticketUrl: scrapedEvent.sourceUrl,
            
            images: scrapedEvent.image ? [scrapedEvent.image] : [],
            coverImage: scrapedEvent.image || '',

            status: 'ACTIVE',
            isVerified: false,
            source: 'scraped',
            
            organizer: { connect: { id: organizer.id } },
          }
        });
        
        savedCount++;
      } catch (error) {
        console.error('Failed to save scraped event:', error);
      }
    }
    
    return savedCount;
  }
  
  private parseDate(dateText: string): Date | null {
    try {
      // Try various date formats
      const parsers = [
        () => new Date(dateText),
        () => new Date(dateText.replace(/(\d+)(st|nd|rd|th)/, '$1')),
        () => {
          const match = dateText.match(/(\w+)\s+(\d+)(?:st|nd|rd|th)?,\s+(\d{4})/);
          if (match) return new Date(`${match[1]} ${match[2]}, ${match[3]}`);
          return null;
        }
      ];
      
      for (const parser of parsers) {
        try {
          const date = parser();
          if (date && !isNaN(date.getTime())) return date;
        } catch (e) {
          continue;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  async runScheduledCollection(): Promise<void> {
    console.log('Starting scheduled event collection...');
    
    const cities = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'];
    
    for (const city of cities) {
      try {
        const ticketmasterCount = await this.collectFromTicketmaster(city, 'AE');
        const scrapedCount = await this.scrapeLocalEvents(city);
        
        console.log(`City: ${city}, Ticketmaster: ${ticketmasterCount}, Scraped: ${scrapedCount}`);
        
        // Update featured events
        await this.updateFeaturedEvents(city);
        
      } catch (error) {
        console.error(`Failed to collect events for ${city}:`, error);
      }
    }
    
    // Clean up old events
    await this.cleanupOldEvents();
    
    console.log('Scheduled event collection completed');
  }
  
  private async updateFeaturedEvents(city: string): Promise<void> {
    // Get popular upcoming events
    const popularEvents = await prisma.event.findMany({
      where: {
        city,
        startDate: { gte: new Date() },
        status: 'ACTIVE',
      },
      orderBy: [
        { wishlistCount: 'desc' },
        { views: 'desc' },
        { startDate: 'asc' }
      ],
      take: 10,
    });
    
    // Reset all featured status
    await prisma.event.updateMany({
      where: { city, isFeatured: true },
      data: { isFeatured: false, featuredOrder: 0 }
    });
    
    // Set new featured events
    for (let i = 0; i < Math.min(popularEvents.length, 5); i++) {
      await prisma.event.update({
        where: { id: popularEvents[i].id },
        data: { 
          isFeatured: true,
          featuredOrder: i + 1
        }
      });
    }
  }
  
  private async cleanupOldEvents(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await prisma.event.deleteMany({
      where: {
        endDate: { lt: thirtyDaysAgo },
        source: 'scraped',
      }
    });
  }
}

export const eventCollector = new EventCollector();