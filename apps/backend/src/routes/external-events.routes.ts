// src/routes/external-events.routes.ts
import express, { Request, Response } from 'express';
import externalEventsService from '../services/external-events.service';
import logger from '../utils/logger';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * GET /api/external-events/fetch
 * Fetch events from all external sources
 */
router.get('/fetch', authenticate, async (req: Request, res: Response) => {
  try {
    const { city, country, keyword } = req.query;

    const events = await externalEventsService.fetchAllEvents({
      city: city as string,
      country: country as string,
      keyword: keyword as string,
    });

    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error: any) {
    logger.error('Error fetching external events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch external events',
      error: error.message,
    });
  }
});

/**
 * GET /api/external-events/ticketmaster
 * Fetch events specifically from Ticketmaster
 */
router.get('/ticketmaster', authenticate, async (req: Request, res: Response) => {
  try {
    const { city, countryCode, keyword, startDateTime, size } = req.query;

    const events = await externalEventsService.fetchTicketmasterEvents({
      city: city as string,
      countryCode: countryCode as string,
      keyword: keyword as string,
      startDateTime: startDateTime as string,
      size: size ? parseInt(size as string) : undefined,
    });

    res.json({
      success: true,
      source: 'ticketmaster',
      count: events.length,
      data: events,
    });
  } catch (error: any) {
    logger.error('Error fetching Ticketmaster events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Ticketmaster events',
      error: error.message,
    });
  }
});

/**
 * GET /api/external-events/eventbrite
 * Fetch events specifically from Eventbrite
 */
router.get('/eventbrite', authenticate, async (req: Request, res: Response) => {
  try {
    const { location, q, startDate } = req.query;

    const events = await externalEventsService.fetchEventbriteEvents({
      location: location as string,
      q: q as string,
      'start_date.range_start': startDate as string,
    });

    res.json({
      success: true,
      source: 'eventbrite',
      count: events.length,
      data: events,
    });
  } catch (error: any) {
    logger.error('Error fetching Eventbrite events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Eventbrite events',
      error: error.message,
    });
  }
});

/**
 * GET /api/external-events/meetup
 * Fetch events specifically from Meetup
 */
router.get('/meetup', authenticate, async (req: Request, res: Response) => {
  try {
    const { lat, lon, radius, text } = req.query;

    const events = await externalEventsService.fetchMeetupEvents({
      lat: lat ? parseFloat(lat as string) : undefined,
      lon: lon ? parseFloat(lon as string) : undefined,
      radius: radius ? parseFloat(radius as string) : undefined,
      text: text as string,
    });

    res.json({
      success: true,
      source: 'meetup',
      count: events.length,
      data: events,
    });
  } catch (error: any) {
    logger.error('Error fetching Meetup events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Meetup events',
      error: error.message,
    });
  }
});

/**
 * GET /api/external-events/platinumlist
 * Fetch events specifically from Platinumlist (UAE/Dubai)
 */
router.get('/platinumlist', authenticate, async (req: Request, res: Response) => {
  try {
    const { city, category, date, limit } = req.query;

    const events = await externalEventsService.fetchPlatinumlistEvents({
      city: city as string,
      category: category as string,
      date: date as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      source: 'platinumlist',
      count: events.length,
      data: events,
    });
  } catch (error: any) {
    logger.error('Error fetching Platinumlist events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Platinumlist events',
      error: error.message,
    });
  }
});

/**
 * POST /api/external-events/sync
 * Fetch and sync external events to database
 */
router.post('/sync', authenticate, async (req: Request, res: Response) => {
  try {
    const { city, country, keyword } = req.body;

    // Fetch events from all sources
    const events = await externalEventsService.fetchAllEvents({
      city,
      country,
      keyword,
    });

    // Sync to database
    const result = await externalEventsService.syncEventsToDatabase(events);

    res.json({
      success: true,
      message: 'Events synced successfully',
      data: {
        fetched: events.length,
        created: result.created,
        updated: result.updated,
        errors: result.errors,
      },
    });
  } catch (error: any) {
    logger.error('Error syncing external events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync external events',
      error: error.message,
    });
  }
});

/**
 * POST /api/external-events/sync/:source
 * Sync events from a specific source
 */
router.post('/sync/:source', authenticate, async (req: Request, res: Response) => {
  try {
    const { source } = req.params;
    const params = req.body;

    let events: any[] = [];

    switch (source.toLowerCase()) {
      case 'ticketmaster':
        events = await externalEventsService.fetchTicketmasterEvents(params);
        break;
      case 'eventbrite':
        events = await externalEventsService.fetchEventbriteEvents(params);
        break;
      case 'meetup':
        events = await externalEventsService.fetchMeetupEvents(params);
        break;
      case 'platinumlist':
        events = await externalEventsService.fetchPlatinumlistEvents(params);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Invalid source: ${source}. Use ticketmaster, eventbrite, meetup, or platinumlist`,
        });
    }

    const result = await externalEventsService.syncEventsToDatabase(events);

    res.json({
      success: true,
      message: `${source} events synced successfully`,
      data: {
        source,
        fetched: events.length,
        created: result.created,
        updated: result.updated,
        errors: result.errors,
      },
    });
  } catch (error: any) {
    logger.error(`Error syncing ${req.params.source} events:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to sync ${req.params.source} events`,
      error: error.message,
    });
  }
});

export default router;
