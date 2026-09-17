// src/api/events/controller.ts - UPDATED with missing methods
import { Request, Response } from 'express';
import prisma from '../../config/database';
import {
  CreateEventInput,
  UpdateEventInput,
  EventQueryInput,
  CreateReviewInput,
  SearchEventsInput
} from '@migo/shared';
import { EventStatus, EventVisibility } from '@prisma/client';
import { createSuccessResponse, createErrorResponse, HTTP_STATUS, ErrorCode } from '@migo/shared';
import logger from '../../utils/logger';
import { uploadToCloudinary } from '../../services/cloudinary.service';
import { AIAgentService } from '../../services/ai.service';

export class EventController {
  private aiService: AIAgentService;

  constructor() {
    this.aiService = new AIAgentService();
  }

  // Get all events with filtering and pagination
  async getEvents(req: Request, res: Response) {
    try {
      const query = req.query as unknown as EventQueryInput;
      
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter: any = {
        status: 'ACTIVE',
        visibility: { in: ['PUBLIC', 'UNLISTED'] },
      };

      // Apply filters
      if (query.category) {
        filter.category = query.category;
      }

      if (query.subcategory) {
        filter.subcategory = query.subcategory;
      }

      if (query.city) {
        filter.city = query.city;
      }

      if (query.country) {
        filter.country = query.country;
      }

      if (query.dateFrom || query.dateTo) {
        filter.startDate = {};
        if (query.dateFrom) {
          filter.startDate.gte = new Date(query.dateFrom);
        }
        if (query.dateTo) {
          filter.startDate.lte = new Date(query.dateTo);
        }
      }

      if (query.priceMin !== undefined || query.priceMax !== undefined) {
        if (query.priceMin !== undefined) {
          filter.priceFrom = { gte: query.priceMin };
        }
        if (query.priceMax !== undefined) {
          filter.priceTo = { lte: query.priceMax };
        }
      }

      if (query.isFree !== undefined) {
        filter.isFree = query.isFree;
      }

      if (query.isFeatured !== undefined) {
        filter.isFeatured = query.isFeatured;
      }

      if (query.isPetFriendly !== undefined) {
        filter.isPetFriendly = query.isPetFriendly;
      }

      if (query.tags && query.tags.length > 0) {
        filter.tags = { array_contains: query.tags };
      }

      // Location-based filtering (if lat/lng provided)
      if (query.lat && query.lng && query.radius) {
        // This is a simplified version - in production, use PostGIS or similar
        filter.latitude = { not: null };
        filter.longitude = { not: null };
      }

      // Search by title, description, venue
      if (query.search) {
        filter.OR = [
          { title: { contains: query.search } },
          { description: { contains: query.search } },
          { venueName: { contains: query.search } },
        ];
      }

      // Build sort object
      const orderBy: any = {};
      switch (query.sortBy) {
        case 'price':
          orderBy.priceFrom = query.sortOrder;
          break;
        case 'popularity':
          orderBy.wishlistCount = query.sortOrder;
          break;
        case 'rating':
          orderBy.ratingAverage = query.sortOrder;
          break;
        case 'distance':
          orderBy.createdAt = 'desc';
          break;
        default:
          orderBy.startDate = query.sortOrder;
      }

      // Get total count for pagination
      const total = await prisma.event.count({ where: filter });

      // Get events
      const events = await prisma.event.findMany({
        where: filter,
        include: {
          organizer: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      });

      // Format events
      const formattedEvents = events.map(event => ({
        id: event.id,
        migoId: event.migoId,
        title: event.title,
        tagline: event.tagline,
        description: event.description,
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
        venueName: event.venueName,
        city: event.city,
        country: event.country,
        priceFrom: event.priceFrom,
        priceTo: event.priceTo,
        currency: event.currency,
        isFree: event.isFree,
        coverImage: event.coverImage,
        images: event.images,
        tags: event.tags,
        ratingAverage: event.ratingAverage,
        ratingCount: event.ratingCount,
        wishlistCount: event.wishlistCount,
        organizer: event.organizer,
        status: event.status,
        visibility: event.visibility,
        isFeatured: event.isFeatured,
        createdAt: event.createdAt,
      }));

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({
        events: formattedEvents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }, 'Events retrieved successfully'));

    } catch (error: any) {
      logger.error('Get events error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve events', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Get single event by ID
  async getEventById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      // First try by ID, then by migoId, then by slug
      let event = await prisma.event.findUnique({
        where: { id },
        include: {
          organizer: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
              isOrganizer: true,
            },
          },
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      });

      if (!event) {
        event = await prisma.event.findFirst({
          where: {
            OR: [
              { migoId: id },
              { slug: id },
            ],
          },
          include: {
            organizer: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                isVerified: true,
                isOrganizer: true,
              },
            },
            reviews: {
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
          },
        });
      }

      if (!event) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse(ErrorCode.EVENT_NOT_FOUND, 'Event not found', HTTP_STATUS.NOT_FOUND));
      }

      // Log view
      if (userId) {
        await prisma.eventView.create({
          data: {
            eventId: event.id,
            userId,
            source: 'direct',
            deviceType: 'web',
          }
        });

        // Update view counts
        await prisma.event.update({
          where: { id: event.id },
          data: {
            views: { increment: 1 },
            uniqueViews: { increment: 1 },
          }
        });
      }

      // Check if user has wishlisted
      let isWishlisted = false;
      if (userId) {
        const wishlist = await prisma.wishlist.findUnique({
          where: {
            userId_eventId: {
              userId,
              eventId: event.id,
            }
          }
        });
        isWishlisted = !!wishlist;
      }

      // Calculate average rating
      const avgRating = event.reviews.length > 0
        ? event.reviews.reduce((sum, review) => sum + review.overallRating, 0) / event.reviews.length
        : 0;

      const eventWithStats = {
        ...event,
        avgRating: parseFloat(avgRating.toFixed(1)),
        reviewCount: event.reviews.length,
        isWishlisted,
      };

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(eventWithStats, 'Event retrieved successfully'));

    } catch (error: any) {
      logger.error('Get event by ID error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve event', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Create a new event
  async createEvent(req: Request, res: Response) {
    try {
      const data: CreateEventInput = req.body;
      const userId = (req as any).user.userId;

      // Check if user is organizer or admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isOrganizer: true, isAdmin: true },
      });

      if (!user || (!user.isOrganizer && !user.isAdmin)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(createErrorResponse(ErrorCode.FORBIDDEN, 'Only organizers and admins can create events', HTTP_STATUS.FORBIDDEN));
      }

      // Generate slug from title
      const slug = data.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

      // Create event
      const event = await prisma.event.create({
        data: {
          ...data,
          slug,
          organizerId: userId,
          status: 'PENDING', // Needs admin approval
          publishedAt: new Date(),
        },
        include: {
          organizer: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });

      // Update user's event count
      await prisma.user.update({
        where: { id: userId },
        data: { eventCount: { increment: 1 } }
      });

      // Create or update organizer profile
      await prisma.organizerProfile.upsert({
        where: { userId },
        update: { totalEvents: { increment: 1 } },
        create: {
          userId,
          businessName: data.venueName || 'Unknown Business',
          businessEmail: data.organizerEmail || '',
          businessPhone: data.organizerPhone || '',
        }
      });

      logger.info(`Event created: ${event.id} by user ${userId}`);
      return res.status(HTTP_STATUS.CREATED).json(createSuccessResponse(event, 'Event created successfully'));

    } catch (error: any) {
      logger.error('Create event error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to create event', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Update event
  async updateEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateEventInput = req.body;
      const userId = (req as any).user.userId;

      // Check if event exists
      const existingEvent = await prisma.event.findUnique({
        where: { id },
      });

      if (!existingEvent) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse(ErrorCode.EVENT_NOT_FOUND, 'Event not found', HTTP_STATUS.NOT_FOUND));
      }

      // Check permissions
      if (existingEvent.organizerId !== userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { isAdmin: true },
        });
        if (!user?.isAdmin) {
          return res.status(HTTP_STATUS.FORBIDDEN).json(createErrorResponse(ErrorCode.FORBIDDEN, 'You can only update your own events', HTTP_STATUS.FORBIDDEN));
        }
      }

      // Generate new slug if title changed
      const updateData: any = { ...data };
      if (data.title && data.title !== existingEvent.title) {
        updateData.slug = data.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();
      }

      // Update event
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
          // If significant changes, require re-approval
          ...(this.requiresReapproval(data) && { status: 'PENDING' }),
        },
        include: {
          organizer: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(updatedEvent, 'Event updated successfully'));

    } catch (error: any) {
      logger.error('Update event error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to update event', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Delete event
  async deleteEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      // Check if event exists
      const existingEvent = await prisma.event.findUnique({
        where: { id },
      });

      if (!existingEvent) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse(ErrorCode.EVENT_NOT_FOUND, 'Event not found', HTTP_STATUS.NOT_FOUND));
      }

      // Check permissions
      if (existingEvent.organizerId !== userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { isAdmin: true },
        });
        if (!user?.isAdmin) {
          return res.status(HTTP_STATUS.FORBIDDEN).json(createErrorResponse(ErrorCode.FORBIDDEN, 'You can only delete your own events', HTTP_STATUS.FORBIDDEN));
        }
      }

      // Check if there are active bookings
      const activeBookings = await prisma.booking.count({
        where: {
          eventId: id,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      if (activeBookings > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Cannot delete event with active bookings', HTTP_STATUS.BAD_REQUEST));
      }

      // Soft delete by changing status
      await prisma.event.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
          updatedAt: new Date(),
        }
      });

      // Update user's event count
      await prisma.user.update({
        where: { id: existingEvent.organizerId },
        data: { eventCount: { decrement: 1 } }
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'Event deleted successfully'));

    } catch (error: any) {
      logger.error('Delete event error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to delete event', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Search events
  async searchEvents(req: Request, res: Response) {
    try {
      const query = req.query as unknown as SearchEventsInput;
      const searchTerm = query.q.toLowerCase();

      const events = await prisma.event.findMany({
        where: {
          status: 'ACTIVE',
          visibility: { in: ['PUBLIC', 'UNLISTED'] },
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } },
            { venueName: { contains: searchTerm } },
          ],
        },
        include: {
          organizer: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
        take: 20,
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(events, 'Search results retrieved'));

    } catch (error: any) {
      logger.error('Search events error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to search events', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Get featured events
  async getFeaturedEvents(req: Request, res: Response) {
    try {
      const events = await prisma.event.findMany({
        where: {
          status: 'ACTIVE',
          isFeatured: true,
          featuredUntil: { gt: new Date() },
          startDate: { gte: new Date() },
        },
        include: {
          organizer: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [
          { featuredOrder: 'asc' },
          { startDate: 'asc' },
        ],
        take: 10,
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(events, 'Featured events retrieved'));
    } catch (error: any) {
      logger.error('Get featured events error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve featured events', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Get upcoming events
  async getUpcomingEvents(req: Request, res: Response) {
    try {
      const events = await prisma.event.findMany({
        where: {
          status: 'ACTIVE',
          visibility: { in: ['PUBLIC', 'UNLISTED'] },
          startDate: { gte: new Date() },
        },
        include: {
          organizer: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          startDate: 'asc',
        },
        take: 20,
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(events, 'Upcoming events retrieved'));
    } catch (error: any) {
      logger.error('Get upcoming events error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve upcoming events', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Get event categories
  async getEventCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.event.groupBy({
        by: ['category'],
        where: {
          status: 'ACTIVE',
          startDate: { gte: new Date() },
        },
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            _all: 'desc',
          },
        },
        take: 20,
      });

      const categoriesWithCount = categories.map(cat => ({
        category: cat.category,
        count: cat._count?._all || 0,
      }));

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(categoriesWithCount, 'Event categories retrieved'));
    } catch (error: any) {
      logger.error('Get categories error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve categories', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Bookmark event (add to wishlist)
  async bookmarkEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id, status: 'ACTIVE' },
      });

      if (!event) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse(ErrorCode.EVENT_NOT_FOUND, 'Event not found', HTTP_STATUS.NOT_FOUND));
      }

      // Check if already bookmarked
      const existing = await prisma.wishlist.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId: id,
          }
        }
      });

      if (existing) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Event already bookmarked', HTTP_STATUS.BAD_REQUEST));
      }

      // Create bookmark
      const bookmark = await prisma.wishlist.create({
        data: {
          userId,
          eventId: id,
        }
      });

      // Update event wishlist count
      await prisma.event.update({
        where: { id },
        data: { wishlistCount: { increment: 1 } }
      });

      // Update user wishlist count
      await prisma.user.update({
        where: { id: userId },
        data: { wishlistCount: { increment: 1 } }
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(bookmark, 'Event bookmarked successfully'));
    } catch (error: any) {
      logger.error('Bookmark event error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to bookmark event', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Remove bookmark (remove from wishlist)
  async removeBookmark(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      // Check if bookmark exists
      const bookmark = await prisma.wishlist.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId: id,
          }
        }
      });

      if (!bookmark) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse(ErrorCode.NOT_FOUND, 'Bookmark not found', HTTP_STATUS.NOT_FOUND));
      }

      // Remove bookmark
      await prisma.wishlist.delete({
        where: {
          userId_eventId: {
            userId,
            eventId: id,
          }
        }
      });

      // Update event wishlist count
      await prisma.event.update({
        where: { id },
        data: { wishlistCount: { decrement: 1 } }
      });

      // Update user wishlist count
      await prisma.user.update({
        where: { id: userId },
        data: { wishlistCount: { decrement: 1 } }
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'Bookmark removed successfully'));
    } catch (error: any) {
      logger.error('Remove bookmark error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to remove bookmark', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Get user's bookmarks
  async getUserBookmarks(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      
      const bookmarks = await prisma.wishlist.findMany({
        where: { userId },
        include: {
          event: {
            include: {
              organizer: {
                select: {
                  id: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const events = bookmarks.map(b => b.event);

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(events, 'Bookmarks retrieved successfully'));
    } catch (error: any) {
      logger.error('Get user bookmarks error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve bookmarks', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Get user's hosted events
  async getUserHostedEvents(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const events = await prisma.event.findMany({
        where: { organizerId: userId },
        include: {
          organizer: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await prisma.event.count({
        where: { organizerId: userId },
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({
        events,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }, 'Hosted events retrieved successfully'));
    } catch (error: any) {
      logger.error('Get user hosted events error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve hosted events', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Get pending events (admin only)
  async getPendingEvents(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const events = await prisma.event.findMany({
        where: { status: 'PENDING' },
        include: {
          organizer: {
            select: {
              id: true,
              displayName: true,
              email: true,
              isVerified: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await prisma.event.count({
        where: { status: 'PENDING' },
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({
        events,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }, 'Pending events retrieved successfully'));
    } catch (error: any) {
      logger.error('Get pending events error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve pending events', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Approve event (admin only)
  async approveEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const event = await prisma.event.findUnique({
        where: { id, status: 'PENDING' },
      });

      if (!event) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse(ErrorCode.EVENT_NOT_FOUND, 'Pending event not found', HTTP_STATUS.NOT_FOUND));
      }

      const updatedEvent = await prisma.event.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          approvedAt: new Date(),
        },
        include: {
          organizer: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
      });

      // TODO: Send notification to organizer

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(updatedEvent, 'Event approved successfully'));
    } catch (error: any) {
      logger.error('Approve event error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to approve event', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Reject event (admin only)
  async rejectEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const event = await prisma.event.findUnique({
        where: { id, status: 'PENDING' },
      });

      if (!event) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse(ErrorCode.EVENT_NOT_FOUND, 'Pending event not found', HTTP_STATUS.NOT_FOUND));
      }

      const updatedEvent = await prisma.event.update({
        where: { id },
        data: {
          status: 'CANCELLED',
        },
        include: {
          organizer: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
      });

      // TODO: Send rejection notification with reason to organizer

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(updatedEvent, 'Event rejected successfully'));
    } catch (error: any) {
      logger.error('Reject event error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to reject event', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Create review
  async createReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: CreateReviewInput = req.body;
      const userId = (req as any).user.userId;

      // Check if user has booked this event
      const booking = await prisma.booking.findFirst({
        where: {
          userId,
          eventId: id,
          status: 'CONFIRMED',
        },
      });

      if (!booking) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, 'You must book this event before reviewing', HTTP_STATUS.BAD_REQUEST));
      }

      // Check if user already reviewed
      const existingReview = await prisma.review.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId: id,
          },
        },
      });

      if (existingReview) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, 'You have already reviewed this event', HTTP_STATUS.BAD_REQUEST));
      }

      const review = await prisma.review.create({
        data: {
          userId,
          eventId: id,
          overallRating: data.rating,
          title: data.title,
          comment: data.comment,
          isRecommended: data.isRecommended,
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Update event rating stats
      await this.updateEventRatingStats(id);

      return res.status(HTTP_STATUS.CREATED).json(createSuccessResponse(review, 'Review created successfully'));
    } catch (error: any) {
      logger.error('Create review error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to create review', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Get event reviews
  async getEventReviews(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const reviews = await prisma.review.findMany({
        where: { eventId: id },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      });

      const total = await prisma.review.count({
        where: { eventId: id },
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({
        reviews,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }, 'Reviews retrieved successfully'));
    } catch (error: any) {
      logger.error('Get reviews error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve reviews', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Upload event images
  async uploadEventImages(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;
      
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, 'No files uploaded', HTTP_STATUS.BAD_REQUEST));
      }

      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event || event.organizerId !== userId) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse(ErrorCode.EVENT_NOT_FOUND, 'Event not found or unauthorized', HTTP_STATUS.NOT_FOUND));
      }

      // Upload images to Cloudinary
      const uploadPromises = (req.files as Express.Multer.File[]).map(file =>
        uploadToCloudinary(file, `events/${id}`)
      );

      const uploadResults = await Promise.all(uploadPromises);
      const imageUrls = uploadResults.map(result => result.secure_url);

      // Update event images
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: {
          images: [...(event.images as any[] || []), ...imageUrls],
        },
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({
        images: imageUrls,
        event: updatedEvent,
      }, 'Images uploaded successfully'));
    } catch (error: any) {
      logger.error('Upload images error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to upload images', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Toggle event status
  async toggleEventStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;
      const { status } = req.body;

      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event || event.organizerId !== userId) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse(ErrorCode.EVENT_NOT_FOUND, 'Event not found or unauthorized', HTTP_STATUS.NOT_FOUND));
      }

      const updatedEvent = await prisma.event.update({
        where: { id },
        data: { status },
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(updatedEvent, `Event status updated to ${status}`));
    } catch (error: any) {
      logger.error('Toggle status error:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to toggle event status', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Helper method to determine if update requires reapproval
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

  // Helper method to update event rating stats
  private async updateEventRatingStats(eventId: string): Promise<void> {
    const reviews = await prisma.review.findMany({
      where: { eventId },
      select: { overallRating: true },
    });

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0);
      const averageRating = totalRating / reviews.length;

      await prisma.event.update({
        where: { id: eventId },
        data: {
          ratingAverage: parseFloat(averageRating.toFixed(1)),
          ratingCount: reviews.length,
        },
      });
    }
  }
}

export const eventController = new EventController();