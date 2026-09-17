// src/api/users/controller.ts - UPDATED
import { Request, Response } from 'express';
import prisma from '../../config/database';
import { createSuccessResponse, createErrorResponse, HTTP_STATUS, ErrorCode } from '@migo/shared';
import logger from '../../utils/logger';
import {
  UpdateProfileInput,
  UpdateLocationInput,
  UpdatePreferencesInput,
  UpdateProfilePictureInput
} from '@migo/shared';

export class UsersController {
  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          role: true,
          isVerified: true,
          isOrganizer: true,
          isAdmin: true,
          website: true,
          twitter: true,
          instagram: true,
          linkedin: true,
          interests: true,
          preferences: true,
          settings: true,
          eventCount: true,
          wishlistCount: true,
          followerCount: true,
          followingCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse(ErrorCode.USER_NOT_FOUND, 'User not found', HTTP_STATUS.NOT_FOUND));
      }

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(user, 'Profile retrieved'));
    } catch (error: any) {
      logger.error('Get profile failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve profile', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const data: UpdateProfileInput = req.body;
      
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          website: true,
          twitter: true,
          instagram: true,
          linkedin: true,
          updatedAt: true,
        },
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(user, 'Profile updated'));
    } catch (error: any) {
      logger.error('Update profile failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to update profile', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  async updateLocation(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const location: UpdateLocationInput = req.body;
      
      // Note: User model doesn't have direct location fields.
      // Location is stored in preferences or as part of user data.
      // For now, we'll update preferences with location data.
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          preferences: {
            ...(await this.getUserPreferences(userId)),
            location,
          },
          updatedAt: new Date(),
        },
        select: {
          id: true,
          displayName: true,
          preferences: true,
          updatedAt: true,
        },
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(user, 'Location updated'));
    } catch (error: any) {
      logger.error('Update location failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to update location', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  async updatePreferences(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const preferences: UpdatePreferencesInput = req.body;
      
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          interests: preferences.interests,
          preferences: preferences.preferences,
          settings: preferences.settings,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          displayName: true,
          interests: true,
          preferences: true,
          settings: true,
          updatedAt: true,
        },
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(user, 'Preferences updated'));
    } catch (error: any) {
      logger.error('Update preferences failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to update preferences', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  async updateProfilePicture(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { imageUrl }: UpdateProfilePictureInput = req.body;
      
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          avatarUrl: imageUrl,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          updatedAt: true,
        },
      });

      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(user, 'Profile picture updated'));
    } catch (error: any) {
      logger.error('Update profile picture failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to update profile picture', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  async uploadProfilePicture(req: Request, res: Response) {
    try {
      // This would handle file uploads via multer/Cloudinary
      // Implementation depends on your file upload setup
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({ message: 'File upload endpoint - implement as needed' }, 'File upload endpoint'));
    } catch (error: any) {
      logger.error('Upload profile picture failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to upload profile picture', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  async getUserBookings(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { page = 1, limit = 10, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      const whereClause: any = { userId };
      if (status) {
        whereClause.status = status;
      }
      
      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where: whereClause,
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                venueName: true,
                city: true,
                coverImage: true,
              },
            },
          },
          skip,
          take: Number(limit),
          orderBy: { bookingDate: 'desc' },
        }),
        prisma.booking.count({ where: whereClause }),
      ]);
      
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({
        bookings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      }, 'Bookings retrieved'));
    } catch (error: any) {
      logger.error('Get user bookings failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve bookings', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  async getWishlist(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      const [wishlistItems, total] = await Promise.all([
        prisma.wishlist.findMany({
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
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.wishlist.count({ where: { userId } }),
      ]);
      
      const wishlist = wishlistItems.map(item => item.event);
      
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({
        wishlist,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      }, 'Wishlist retrieved'));
    } catch (error: any) {
      logger.error('Get wishlist failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve wishlist', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { unreadOnly = 'false', page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      const whereClause: any = { userId };
      if (unreadOnly === 'true') {
        whereClause.isRead = false;
      }
      
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.count({ where: whereClause }),
      ]);
      
      // Mark as sent if not already
      const unreadNotifications = notifications.filter(n => !n.isSent);
      if (unreadNotifications.length > 0) {
        await prisma.notification.updateMany({
          where: {
            id: { in: unreadNotifications.map(n => n.id) },
          },
          data: { isSent: true, sentAt: new Date() },
        });
      }
      
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      }, 'Notifications retrieved'));
    } catch (error: any) {
      logger.error('Get notifications failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve notifications', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  async deleteAccount(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      
      // Check for active bookings
      const activeBookings = await prisma.booking.count({
        where: {
          userId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });
      
      if (activeBookings > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Cannot delete account with active bookings', HTTP_STATUS.BAD_REQUEST));
      }
      
      // Soft delete: mark as deleted and remove personal data
      await prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@deleted.com`,
          phone: null,
          name: 'Deleted User',
          displayName: 'Deleted User',
          avatarUrl: null,
          bio: null,
          password: null, // Remove password
          isVerified: false,
          lastActiveAt: new Date(),
          // Note: We're not actually deleting the account, just anonymizing it
        },
      });
      
      // Delete sensitive data
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
      
      logger.info(`Account anonymized: ${userId}`);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'Account deleted successfully'));
    } catch (error: any) {
      logger.error('Delete account failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to delete account', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          isVerified: true,
          isOrganizer: true,
          website: true,
          twitter: true,
          instagram: true,
          linkedin: true,
          eventCount: true,
          wishlistCount: true,
          followerCount: true,
          followingCount: true,
          createdAt: true,
        },
      });
      
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse(ErrorCode.USER_NOT_FOUND, 'User not found', HTTP_STATUS.NOT_FOUND));
      }
      
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(user, 'User retrieved'));
    } catch (error: any) {
      logger.error('Get user by ID failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve user', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  async followUser(req: Request, res: Response) {
    try {
      const currentUserId = (req as any).user.userId;
      const { userId } = req.params;
      
      if (currentUserId === userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Cannot follow yourself', HTTP_STATUS.BAD_REQUEST));
      }
      
      // Check if already following
      // Note: We don't have a Follow model in the schema
      // For now, we'll return a placeholder
      
      logger.info(`User ${currentUserId} attempted to follow ${userId}`);
      
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({
        following: true,
        message: 'Follow functionality not implemented yet'
      }, 'Follow feature coming soon'));
    } catch (error: any) {
      logger.error('Follow user failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to follow user', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  async unfollowUser(req: Request, res: Response) {
    try {
      const currentUserId = (req as any).user.userId;
      const { userId } = req.params;
      
      logger.info(`User ${currentUserId} attempted to unfollow ${userId}`);
      
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({
        following: false,
        message: 'Unfollow functionality not implemented yet'
      }, 'Unfollow feature coming soon'));
    } catch (error: any) {
      logger.error('Unfollow user failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to unfollow user', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  async getUserEvents(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where: { 
            organizerId: userId,
            status: 'ACTIVE',
            visibility: { in: ['PUBLIC', 'UNLISTED'] },
          },
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
          orderBy: { startDate: 'asc' },
        }),
        prisma.event.count({
          where: { 
            organizerId: userId,
            status: 'ACTIVE',
            visibility: { in: ['PUBLIC', 'UNLISTED'] },
          },
        }),
      ]);
      
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({
        events,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      }, 'User events retrieved'));
    } catch (error: any) {
      logger.error('Get user events failed:', error);
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message || 'Failed to retrieve user events', HTTP_STATUS.INTERNAL_ERROR));
    }
  }

  // Helper method to get user preferences
  private async getUserPreferences(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    
    return user?.preferences || {};
  }
}

export const usersController = new UsersController();