// src/api/reviews/routes.ts
import { Router } from 'express';
import { reviewsController } from './controller';
import { validate } from '../../middlewares/validation.middleware';
import { createReviewSchema, updateReviewSchema } from '@migo/shared';

const publicRouter = Router();
const protectedRouter = Router();

// ========== PUBLIC ROUTES ==========

// Get reviews for event
publicRouter.get('/event/:eventId', reviewsController.getEventReviews);

// Get user's reviews
publicRouter.get('/user/:userId', reviewsController.getUserReviews);

// Get recent reviews
publicRouter.get('/recent', reviewsController.getRecentReviews);

// ========== PROTECTED ROUTES ==========

// Create review
protectedRouter.post('/', validate(createReviewSchema), reviewsController.createReview);

// Update review
protectedRouter.put('/:id', validate(updateReviewSchema), reviewsController.updateReview);

// Delete review
protectedRouter.delete('/:id', reviewsController.deleteReview);

// Like/dislike review
protectedRouter.post('/:id/like', reviewsController.toggleLike);

// Report review
protectedRouter.post('/:id/report', reviewsController.reportReview);

export default {
  public: publicRouter,
  protected: protectedRouter
};