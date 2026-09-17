// src/routes/events.routes.ts - COMPLETE FIXED VERSION
import { Router, Request, Response } from "express";
import { eventService, EventFilters } from "../services/events.service";
import { authenticate, AuthRequest } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/error.middleware";
import { z } from "zod";

const router = Router();

// Helper function to parse query parameters safely
const parseQueryParam = <T>(param: any, defaultValue?: T): T | undefined => {
  if (param === undefined || param === null) return defaultValue;
  if (Array.isArray(param)) return param[0] as T;
  return param as T;
};

// Helper function to parse number safely
const parseNumberParam = (param: any, defaultValue: number): number => {
  const value = parseQueryParam(param, defaultValue.toString());
  const num = parseInt(value as string, 10);
  return isNaN(num) ? defaultValue : num;
};

// Helper function to parse date safely
const parseDateParam = (param: any): Date | undefined => {
  const value = parseQueryParam<string>(param);
  if (!value) return undefined;
  
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
};

// Helper function to parse boolean safely
const parseBooleanParam = (param: any): boolean | undefined => {
  const value = parseQueryParam<string>(param);
  if (value === undefined) return undefined;
  return value === "true";
};

// Helper function to parse array parameters (specifically for tags)
const parseArrayParam = (param: any): string[] | undefined => {
  if (param === undefined || param === null) return undefined;
  
  if (Array.isArray(param)) {
    // Already an array from query string like ?tags[]=music&tags[]=party
    return param as string[];
  }
  
  if (typeof param === 'string') {
    // Comma-separated string: ?tags=music,party,outdoor
    if (param.trim() === '') return [];
    return param.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }
  
  return undefined;
};

// Get all events with filters
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const filters: EventFilters = {
    page: parseNumberParam(req.query.page, 1),
    limit: parseNumberParam(req.query.limit, 20),
    category: parseQueryParam<string>(req.query.category),
    subcategory: parseQueryParam<string>(req.query.subcategory),
    city: parseQueryParam<string>(req.query.city),
    country: parseQueryParam<string>(req.query.country),
    dateFrom: parseDateParam(req.query.dateFrom),
    dateTo: parseDateParam(req.query.dateTo),
    priceMin: parseNumberParam(req.query.priceMin, 0),
    priceMax: parseNumberParam(req.query.priceMax, 1000),
    isFree: parseBooleanParam(req.query.isFree),
    isFeatured: parseBooleanParam(req.query.isFeatured),
    tags: parseArrayParam(req.query.tags),  // Fixed: Now returns string[] | undefined
    search: parseQueryParam<string>(req.query.search),
    sortBy: parseQueryParam<string>(req.query.sortBy) as 'date' | 'price' | 'popularity' | 'distance' | 'rating' || "date",
    sortOrder: parseQueryParam<string>(req.query.sortOrder) as 'asc' | 'desc' || "asc",
  };

  console.log('Event filters:', filters); // Debug log
  
  const result = await eventService.getEvents(filters);
  res.json({ success: true, data: result });
}));

// Get featured events
router.get("/featured", asyncHandler(async (req: Request, res: Response) => {
  const city = parseQueryParam<string>(req.query.city);
  const limit = parseNumberParam(req.query.limit, 10);
  
  const result = await eventService.getFeaturedEvents(city, limit);
  res.json({ success: true, data: result });
}));

// Get today's events
router.get("/today", asyncHandler(async (req: Request, res: Response) => {
  const city = parseQueryParam<string>(req.query.city);
  const limit = parseNumberParam(req.query.limit, 20);
  
  const result = await eventService.getTodaysEvents(city, limit);
  res.json({ success: true, data: result });
}));

// Get weekend events
router.get("/weekend", asyncHandler(async (req: Request, res: Response) => {
  const city = parseQueryParam<string>(req.query.city);
  const limit = parseNumberParam(req.query.limit, 20);
  
  const result = await eventService.getWeekendEvents(city, limit);
  res.json({ success: true, data: result });
}));

// Get event by ID
router.get("/:id", asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;
  
  const result = await eventService.getEventById(id, userId);
  res.json({ success: true, data: result });
}));

// Search events
router.get("/search/suggestions", asyncHandler(async (req: Request, res: Response) => {
  const query = parseQueryParam<string>(req.query.query);
  const city = parseQueryParam<string>(req.query.city);
  const limit = parseNumberParam(req.query.limit, 10);
  
  if (!query) {
    res.status(400).json({ success: false, error: "Query parameter is required" });
    return;
  }
  
  const result = await eventService.searchSuggestions(query, city, limit);
  res.json({ success: true, data: result });
}));

// Get quick filter options
router.get("/filters/quick", asyncHandler(async (req: Request, res: Response) => {
  const result = await eventService.getQuickFilters();
  res.json({ success: true, data: result });
}));

// Create event (organizer)
router.post("/", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  // Validation schema for event creation
  const eventSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10).max(5000),
    category: z.string(),
    subcategory: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    venueName: z.string(),
    address: z.string(),
    city: z.string(),
    country: z.string(),
    locationLat: z.number(),
    locationLng: z.number(),
    priceFrom: z.number().optional(),
    priceTo: z.number().optional(),
    currency: z.string().default("USD"),
    isFree: z.boolean().default(false),
    ticketUrl: z.string().url(),
    images: z.array(z.string().url()).optional().default([]),
    ageRestriction: z.number().optional(),
    dressCode: z.string().optional(),
    isPetFriendly: z.boolean().default(false),
    facilities: z.array(z.string()).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
  });

  const validatedData = eventSchema.parse(req.body);
  const userId = req.userId!;
  
  const result = await eventService.createEvent(userId, validatedData);
  res.status(201).json({ success: true, data: result });
}));

// Update event (organizer)
router.put("/:id", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  const userId = req.userId!;
  
  // Partial validation schema for event update
  const updateSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).max(5000).optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    venueName: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    locationLat: z.number().optional(),
    locationLng: z.number().optional(),
    priceFrom: z.number().optional(),
    priceTo: z.number().optional(),
    currency: z.string().optional(),
    isFree: z.boolean().optional(),
    ticketUrl: z.string().url().optional(),
    images: z.array(z.string().url()).optional(),
    ageRestriction: z.number().optional(),
    dressCode: z.string().optional(),
    isPetFriendly: z.boolean().optional(),
    facilities: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }).partial();

  const validatedData = updateSchema.parse(updateData);
  
  const result = await eventService.updateEvent(id, userId, validatedData);
  res.json({ success: true, data: result });
}));

// Delete event (organizer)
router.delete("/:id", authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId!;
  
  await eventService.deleteEvent(id, userId);
  res.json({ success: true, message: "Event deleted successfully" });
}));

export { router as eventsRouter };