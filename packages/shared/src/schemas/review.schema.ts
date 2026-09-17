/**
 * Review validation schemas
 * For event reviews and ratings
 */
import { z } from 'zod';
import { RATING_MIN, RATING_MAX, REVIEW_TITLE_MAX_LENGTH, REVIEW_COMMENT_MAX_LENGTH } from '../constants';

// Create review schema (can also be used standalone, not just for events)
export const createReviewSchema = z.object({
  body: z.object({
    eventId: z.string().min(1, 'Event ID is required'),
    rating: z
      .number()
      .min(RATING_MIN)
      .max(RATING_MAX, `Rating must be between ${RATING_MIN} and ${RATING_MAX}`),
    title: z.string().min(1, 'Title is required').max(REVIEW_TITLE_MAX_LENGTH),
    comment: z
      .string()
      .max(REVIEW_COMMENT_MAX_LENGTH, `Comment must be less than ${REVIEW_COMMENT_MAX_LENGTH} characters`)
      .optional(),
    isRecommended: z.boolean().default(true),
  }),
});

// Update review schema
export const updateReviewSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Review ID is required'),
  }),
  body: z.object({
    rating: z
      .number()
      .min(RATING_MIN)
      .max(RATING_MAX, `Rating must be between ${RATING_MIN} and ${RATING_MAX}`)
      .optional(),
    title: z.string().min(1, 'Title is required').max(REVIEW_TITLE_MAX_LENGTH).optional(),
    comment: z
      .string()
      .max(REVIEW_COMMENT_MAX_LENGTH, `Comment must be less than ${REVIEW_COMMENT_MAX_LENGTH} characters`)
      .optional(),
    isRecommended: z.boolean().optional(),
  }),
});

// Review ID schema
export const reviewIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Review ID is required'),
  }),
});

// Type exports
export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>['body'];
